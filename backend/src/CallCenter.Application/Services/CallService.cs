using AutoMapper;
using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Application.Dtos.ResponseDtos;
using CallCenter.Domain.Entities;
using CallCenter.Domain.Enums;

namespace CallCenter.Application.Services;

internal sealed class CallService(
    ICallRepository callRepository,
    ICallEventRepository callEventRepository,
    ICallQueueRepository callQueueRepository,
    ICustomerRepository customerRepository,
    IUnitOfWork unitOfWork,
    ITelephonyProvider telephonyProvider,
    ICrmSimulationService crmSimulationService,
    ICallAssignmentService callAssignmentService,
    IMapper mapper) : ICallService
{
    public async Task<CallResponseDto> CreateInboundCallAsync(
        CreateCallRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var queue = await callQueueRepository.GetByIdAsync(request.CallQueueId, cancellationToken);
        if (queue is null || !queue.IsActive)
            throw new KeyNotFoundException("Active call queue was not found.");

        Customer? customer = null;
        string callerPhoneNumber;
        if (request.CustomerId.HasValue)
        {
            customer = await customerRepository.GetByIdAsync(
                    request.CustomerId.Value,
                    cancellationToken)
                ?? throw new KeyNotFoundException("Customer was not found.");
            callerPhoneNumber = customer.PhoneNumber;
        }
        else
        {
            callerPhoneNumber = request.CallerPhoneNumber?.Trim()
                ?? throw new ArgumentException("Caller phone number is required.");
        }

        var now = DateTimeOffset.UtcNow;
        var call = new Call
        {
            CallReferenceNumber = await telephonyProvider.GenerateCallReferenceAsync(
                cancellationToken),
            Direction = CallDirection.Inbound,
            Status = CallStatus.Waiting,
            CallerPhoneNumber = callerPhoneNumber,
            CustomerId = customer?.Id,
            Customer = customer,
            CallQueueId = queue.Id,
            CallQueue = queue,
            CrmSyncStatus = CrmSyncStatus.Pending
        };
        call.CallEvents.Add(new CallEvent
        {
            EventType = CallEventType.Created,
            EventAtUtc = now,
            Details = "Simulated inbound call created."
        });

        await callRepository.AddAsync(call, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return mapper.Map<CallResponseDto>(call);
    }

    public async Task<IReadOnlyCollection<CallResponseDto>> GetWaitingCallsAsync(
        CancellationToken cancellationToken = default)
    {
        var calls = await callRepository.GetWaitingCallsAsync(cancellationToken);
        return mapper.Map<IReadOnlyCollection<CallResponseDto>>(calls);
    }

    public async Task<CallResponseDto?> GetCurrentCallForAgentAsync(
        Guid agentId,
        CancellationToken cancellationToken = default)
    {
        var call = await callRepository.GetCurrentCallForAgentAsync(agentId, cancellationToken);
        return call is null ? null : mapper.Map<CallResponseDto>(call);
    }

    public async Task<CallResponseDto> AcceptAsync(
        Guid callId,
        Guid agentId,
        CancellationToken cancellationToken = default) =>
        await unitOfWork.ExecuteInTransactionAsync(async token =>
        {
            var call = await GetCallAsync(callId, token);
            EnsureAssignedAgent(call, agentId);
            if (call.Status != CallStatus.Assigned)
                throw new InvalidOperationException("Only an assigned call can be accepted.");
            if (await callRepository.HasActiveCallForAgentAsync(
                    agentId,
                    call.Id,
                    token))
            {
                throw new InvalidOperationException(
                    "Complete the active call before accepting another assigned call.");
            }

            var now = DateTimeOffset.UtcNow;
            call.Status = CallStatus.Active;
            call.AcceptedAtUtc = now;
            call.UpdatedAtUtc = now;
            await callEventRepository.AddAsync(new CallEvent
            {
                CallId = call.Id,
                Call = call,
                EventType = CallEventType.Accepted,
                EventAtUtc = now,
                Details = "Call accepted by the assigned agent."
            }, token);
            await unitOfWork.SaveChangesAsync(token);

            return mapper.Map<CallResponseDto>(call);
        }, System.Data.IsolationLevel.Serializable, cancellationToken);

    public async Task<CallResponseDto> CompleteAsync(
        Guid callId,
        Guid agentId,
        CompleteCallRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var call = await GetCallAsync(callId, cancellationToken);
        EnsureAssignedAgent(call, agentId);
        if (call.Status != CallStatus.Active)
            throw new InvalidOperationException("Only an active call can be completed.");

        var agent = call.AssignedAgent
            ?? throw new KeyNotFoundException("Assigned agent was not found.");
        var now = DateTimeOffset.UtcNow;
        call.Status = CallStatus.Completed;
        call.CompletedAtUtc = now;
        call.Outcome = request.Outcome!.Value;
        call.Notes = NormalizeOptional(request.Notes);
        call.UpdatedAtUtc = now;
        var hasAnotherAssignedCall = await callRepository.HasOtherAssignedCallsAsync(
            agentId,
            call.Id,
            cancellationToken);
        agent.Status = hasAnotherAssignedCall ? AgentStatus.Busy : AgentStatus.Available;
        agent.LastAvailableAtUtc = hasAnotherAssignedCall ? agent.LastAvailableAtUtc : now;
        agent.UpdatedAtUtc = now;
        await callEventRepository.AddAsync(new CallEvent
        {
            CallId = call.Id,
            Call = call,
            EventType = CallEventType.Completed,
            EventAtUtc = now,
            Details = $"Call completed with outcome {call.Outcome}."
        }, cancellationToken);
        call.CrmSyncStatus = await crmSimulationService.SynchronizeCallActivityAsync(
            call,
            cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var response = mapper.Map<CallResponseDto>(call);
        if (!hasAnotherAssignedCall)
        {
            await callAssignmentService.TryAssignNextWaitingCallToAgentAsync(
                agent.Id,
                cancellationToken);
        }
        return response;
    }

    public async Task<PagedResponseDto<CallHistoryResponseDto>> GetHistoryAsync(
        CallHistoryRequestDto request,
        Guid? restrictedAgentId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await callRepository.GetCallHistoryAsync(
            request,
            restrictedAgentId,
            cancellationToken);

        return new PagedResponseDto<CallHistoryResponseDto>
        {
            Items = mapper.Map<IReadOnlyCollection<CallHistoryResponseDto>>(result.Items),
            TotalCount = result.TotalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task<CallDetailsResponseDto> GetDetailsAsync(
        Guid callId,
        Guid? restrictedAgentId = null,
        CancellationToken cancellationToken = default)
    {
        var call = await callRepository.GetByIdWithDetailsAsync(callId, cancellationToken)
            ?? throw new KeyNotFoundException("Call was not found.");
        if (restrictedAgentId.HasValue && call.AssignedAgentId != restrictedAgentId.Value)
            throw new KeyNotFoundException("Call was not found.");

        return mapper.Map<CallDetailsResponseDto>(call);
    }

    private async Task<Call> GetCallAsync(Guid callId, CancellationToken cancellationToken) =>
        await callRepository.GetByIdWithDetailsAsync(callId, cancellationToken)
            ?? throw new KeyNotFoundException("Call was not found.");

    private static void EnsureAssignedAgent(Call call, Guid agentId)
    {
        if (call.AssignedAgentId != agentId)
            throw new UnauthorizedAccessException(
                "Only the assigned agent may perform this action.");
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

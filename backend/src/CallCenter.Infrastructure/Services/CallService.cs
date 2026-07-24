using AutoMapper;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Application.Dtos.ResponseDtos;
using CallCenter.Domain.Entities;
using CallCenter.Domain.Enums;
using CallCenter.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CallCenter.Infrastructure.Services;

internal sealed class CallService(
    CallCenterDbContext db,
    ITelephonyProvider telephonyProvider,
    ICrmSimulationService crmSimulationService,
    ICallAssignmentService callAssignmentService,
    IMapper mapper) : ICallService
{
    public async Task<CallResponseDto> CreateInboundCallAsync(
        CreateCallRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var queue = await db.CallQueues
            .SingleOrDefaultAsync(x => x.Id == request.CallQueueId && x.IsActive, cancellationToken)
            ?? throw new KeyNotFoundException("Active call queue was not found.");

        Customer? customer = null;
        string callerPhoneNumber;
        if (request.CustomerId.HasValue)
        {
            customer = await db.Customers
                .SingleOrDefaultAsync(x => x.Id == request.CustomerId.Value, cancellationToken)
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
            CallReferenceNumber = await telephonyProvider.GenerateCallReferenceAsync(cancellationToken),
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

        db.Calls.Add(call);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<CallResponseDto>(call);
    }

    public async Task<IReadOnlyCollection<CallResponseDto>> GetWaitingCallsAsync(
        CancellationToken cancellationToken = default)
    {
        var calls = await BaseCallQuery().AsNoTracking()
            .Where(x => x.Status == CallStatus.Waiting)
            .OrderBy(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyCollection<CallResponseDto>>(calls);
    }

    public async Task<CallResponseDto?> GetCurrentCallForAgentAsync(
        Guid agentId,
        CancellationToken cancellationToken = default)
    {
        var call = await BaseCallQuery().AsNoTracking()
            .Where(x => x.AssignedAgentId == agentId &&
                (x.Status == CallStatus.Assigned || x.Status == CallStatus.Active))
            .OrderByDescending(x => x.AssignedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
        return call is null ? null : mapper.Map<CallResponseDto>(call);
    }

    public async Task<CallResponseDto> AcceptAsync(
        Guid callId,
        Guid agentId,
        CancellationToken cancellationToken = default)
    {
        var call = await BaseCallQuery()
            .SingleOrDefaultAsync(x => x.Id == callId, cancellationToken)
            ?? throw new KeyNotFoundException("Call was not found.");
        EnsureAssignedAgent(call, agentId);
        if (call.Status != CallStatus.Assigned)
            throw new InvalidOperationException("Only an assigned call can be accepted.");

        var now = DateTimeOffset.UtcNow;
        call.Status = CallStatus.Active;
        call.AcceptedAtUtc = now;
        call.UpdatedAtUtc = now;
        db.CallEvents.Add(new CallEvent
        {
            CallId = call.Id,
            Call = call,
            EventType = CallEventType.Accepted,
            EventAtUtc = now,
            Details = "Call accepted by the assigned agent."
        });
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<CallResponseDto>(call);
    }

    public async Task<CallResponseDto> CompleteAsync(
        Guid callId,
        Guid agentId,
        CompleteCallRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var call = await BaseCallQuery()
            .SingleOrDefaultAsync(x => x.Id == callId, cancellationToken)
            ?? throw new KeyNotFoundException("Call was not found.");
        EnsureAssignedAgent(call, agentId);
        if (call.Status != CallStatus.Active)
            throw new InvalidOperationException("Only an active call can be completed.");

        var agent = call.AssignedAgent
            ?? throw new KeyNotFoundException("Assigned agent was not found.");
        var now = DateTimeOffset.UtcNow;
        call.Status = CallStatus.Completed;
        call.CompletedAtUtc = now;
        call.Outcome = request.Outcome!.Value;
        call.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        call.UpdatedAtUtc = now;
        agent.Status = AgentStatus.Available;
        agent.LastAvailableAtUtc = now;
        agent.UpdatedAtUtc = now;
        db.CallEvents.Add(new CallEvent
        {
            CallId = call.Id,
            Call = call,
            EventType = CallEventType.Completed,
            EventAtUtc = now,
            Details = $"Call completed with outcome {call.Outcome}."
        });
        call.CrmSyncStatus = await crmSimulationService.SynchronizeCallActivityAsync(call, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        var response = mapper.Map<CallResponseDto>(call);
        await callAssignmentService.TryAssignNextWaitingCallToAgentAsync(agent.Id, cancellationToken);
        return response;
    }

    public async Task<PagedResponseDto<CallHistoryResponseDto>> GetHistoryAsync(
        CallHistoryRequestDto request,
        Guid? restrictedAgentId = null,
        CancellationToken cancellationToken = default)
    {
        var query = BaseCallQuery().AsNoTracking();
        if (restrictedAgentId.HasValue)
            query = query.Where(x => x.AssignedAgentId == restrictedAgentId.Value);
        else if (request.AgentId.HasValue)
            query = query.Where(x => x.AssignedAgentId == request.AgentId.Value);
        if (!string.IsNullOrWhiteSpace(request.CustomerSearch))
        {
            var search = request.CustomerSearch.Trim();
            query = query.Where(x => x.Customer != null &&
                (x.Customer.Name.Contains(search) || x.Customer.CustomerReferenceNumber.Contains(search)));
        }
        if (request.Status.HasValue)
            query = query.Where(x => x.Status == request.Status.Value);
        if (request.Outcome.HasValue)
            query = query.Where(x => x.Outcome == request.Outcome.Value);
        if (request.FromDateUtc.HasValue)
            query = query.Where(x => x.CreatedAtUtc >= request.FromDateUtc.Value);
        if (request.ToDateUtc.HasValue)
            query = query.Where(x => x.CreatedAtUtc <= request.ToDateUtc.Value);

        var totalCount = await query.CountAsync(cancellationToken);
        var calls = await query.OrderByDescending(x => x.CreatedAtUtc)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);
        return new PagedResponseDto<CallHistoryResponseDto>
        {
            Items = mapper.Map<IReadOnlyCollection<CallHistoryResponseDto>>(calls),
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task<CallDetailsResponseDto> GetDetailsAsync(
        Guid callId,
        Guid? restrictedAgentId = null,
        CancellationToken cancellationToken = default)
    {
        var call = await BaseCallQuery().AsNoTracking()
            .Include(x => x.CallEvents.OrderBy(callEvent => callEvent.EventAtUtc))
            .SingleOrDefaultAsync(x => x.Id == callId, cancellationToken)
            ?? throw new KeyNotFoundException("Call was not found.");
        if (restrictedAgentId.HasValue && call.AssignedAgentId != restrictedAgentId.Value)
            throw new KeyNotFoundException("Call was not found.");
        return mapper.Map<CallDetailsResponseDto>(call);
    }

    private IQueryable<Call> BaseCallQuery() => db.Calls
        .Include(x => x.Customer)
        .Include(x => x.CallQueue)
        .Include(x => x.AssignedAgent);

    private static void EnsureAssignedAgent(Call call, Guid agentId)
    {
        if (call.AssignedAgentId != agentId)
            throw new UnauthorizedAccessException("Only the assigned agent may perform this action.");
    }
}

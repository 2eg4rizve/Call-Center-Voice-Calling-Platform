using AutoMapper;
using CallCenter.Application.Common.Exceptions;
using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.ResponseDtos;
using CallCenter.Domain.Entities;
using CallCenter.Domain.Enums;
using System.Data;

namespace CallCenter.Application.Services;

internal sealed class CallAssignmentService(
    ICallRepository callRepository,
    ICallEventRepository callEventRepository,
    IAgentRepository agentRepository,
    IUnitOfWork unitOfWork,
    IMapper mapper) : ICallAssignmentService
{
    public async Task<CallResponseDto?> TryAssignCallAsync(
        Guid callId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return await unitOfWork.ExecuteInTransactionAsync(async token =>
            {
                var call = await callRepository.GetByIdWithDetailsAsync(callId, token)
                    ?? throw new KeyNotFoundException("Call was not found.");
                if (call.Status != CallStatus.Waiting)
                    throw new InvalidOperationException("Only a waiting call can be assigned.");

                var agent = await agentRepository.GetLongestIdleEligibleAgentAsync(
                    call.CallQueueId,
                    token);
                if (agent is null)
                    return null;

                await AssignAsync(call, agent, token);
                await unitOfWork.SaveChangesAsync(token);
                return mapper.Map<CallResponseDto>(call);
            }, IsolationLevel.Serializable, cancellationToken);
        }
        catch (DataConcurrencyException exception)
        {
            throw AssignmentChanged(exception);
        }
    }

    public async Task<CallResponseDto?> TryAssignNextWaitingCallToAgentAsync(
        Guid agentId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return await unitOfWork.ExecuteInTransactionAsync(async token =>
            {
                var agent = await agentRepository.GetByIdWithCallQueuesAsync(agentId, token)
                    ?? throw new KeyNotFoundException("Agent was not found.");
                if (agent.Status != AgentStatus.Available ||
                    await agentRepository.HasAssignedOrActiveCallAsync(agentId, token))
                {
                    return null;
                }

                var call = await callRepository.GetOldestWaitingCallForAgentAsync(
                    agentId,
                    token);
                if (call is null)
                    return null;

                await AssignAsync(call, agent, token);
                await unitOfWork.SaveChangesAsync(token);
                return mapper.Map<CallResponseDto>(call);
            }, IsolationLevel.Serializable, cancellationToken);
        }
        catch (DataConcurrencyException exception)
        {
            throw AssignmentChanged(exception);
        }
    }

    private async Task AssignAsync(
        Call call,
        Agent agent,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        call.Status = CallStatus.Assigned;
        call.AssignedAgentId = agent.Id;
        call.AssignedAgent = agent;
        call.AssignedAtUtc = now;
        call.UpdatedAtUtc = now;
        agent.Status = AgentStatus.Busy;
        agent.UpdatedAtUtc = now;
        await callEventRepository.AddAsync(new CallEvent
        {
            CallId = call.Id,
            Call = call,
            EventType = CallEventType.Assigned,
            EventAtUtc = now,
            Details = $"Assigned to agent {agent.DisplayName}."
        }, cancellationToken);
    }

    private static InvalidOperationException AssignmentChanged(Exception innerException) =>
        new(
            "The call assignment changed while the request was being processed. Refresh and try again.",
            innerException);
}

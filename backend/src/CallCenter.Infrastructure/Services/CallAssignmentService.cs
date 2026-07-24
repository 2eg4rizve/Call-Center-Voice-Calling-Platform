using AutoMapper;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.ResponseDtos;
using CallCenter.Domain.Entities;
using CallCenter.Domain.Enums;
using CallCenter.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace CallCenter.Infrastructure.Services;

internal sealed class CallAssignmentService(CallCenterDbContext db, IMapper mapper) : ICallAssignmentService
{
    public async Task<CallResponseDto?> TryAssignCallAsync(
        Guid callId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await using var transaction = await db.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            var call = await CallQuery()
                .SingleOrDefaultAsync(x => x.Id == callId, cancellationToken)
                ?? throw new KeyNotFoundException("Call was not found.");

            if (call.Status != CallStatus.Waiting)
                throw new InvalidOperationException("Only a waiting call can be assigned.");

            var agent = await EligibleAgents(call.CallQueueId)
                .OrderBy(x => x.LastAvailableAtUtc ?? DateTimeOffset.MinValue)
                .ThenBy(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (agent is null)
            {
                await transaction.CommitAsync(cancellationToken);
                return null;
            }

            Assign(call, agent);
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return mapper.Map<CallResponseDto>(call);
        }
        catch (DbUpdateConcurrencyException exception)
        {
            throw new InvalidOperationException(
                "The call assignment changed while the request was being processed. Refresh and try again.",
                exception);
        }
    }

    public async Task<CallResponseDto?> TryAssignNextWaitingCallToAgentAsync(
        Guid agentId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await using var transaction = await db.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            var agent = await db.Agents
                .Include(x => x.AgentQueues)
                .SingleOrDefaultAsync(x => x.Id == agentId, cancellationToken)
                ?? throw new KeyNotFoundException("Agent was not found.");

            if (agent.Status != AgentStatus.Available ||
                await db.Calls.AnyAsync(x => x.AssignedAgentId == agentId &&
                    (x.Status == CallStatus.Assigned || x.Status == CallStatus.Active), cancellationToken))
            {
                await transaction.CommitAsync(cancellationToken);
                return null;
            }

            var queueIds = agent.AgentQueues.Select(x => x.CallQueueId).ToArray();
            var call = await CallQuery()
                .Where(x => x.Status == CallStatus.Waiting && queueIds.Contains(x.CallQueueId))
                .OrderBy(x => x.CreatedAtUtc)
                .ThenBy(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (call is null)
            {
                await transaction.CommitAsync(cancellationToken);
                return null;
            }

            Assign(call, agent);
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return mapper.Map<CallResponseDto>(call);
        }
        catch (DbUpdateConcurrencyException exception)
        {
            throw new InvalidOperationException(
                "The call assignment changed while the request was being processed. Refresh and try again.",
                exception);
        }
    }

    private IQueryable<Agent> EligibleAgents(Guid callQueueId) =>
        db.Agents.Where(agent =>
            agent.Status == AgentStatus.Available &&
            agent.AgentQueues.Any(membership => membership.CallQueueId == callQueueId) &&
            !agent.AssignedCalls.Any(call =>
                call.Status == CallStatus.Assigned || call.Status == CallStatus.Active));

    private IQueryable<Call> CallQuery() => db.Calls
        .Include(x => x.Customer)
        .Include(x => x.CallQueue)
        .Include(x => x.AssignedAgent);

    private void Assign(Call call, Agent agent)
    {
        var now = DateTimeOffset.UtcNow;
        call.Status = CallStatus.Assigned;
        call.AssignedAgentId = agent.Id;
        call.AssignedAgent = agent;
        call.AssignedAtUtc = now;
        call.UpdatedAtUtc = now;
        agent.Status = AgentStatus.Busy;
        agent.UpdatedAtUtc = now;
        db.CallEvents.Add(new CallEvent
        {
            CallId = call.Id,
            Call = call,
            EventType = CallEventType.Assigned,
            EventAtUtc = now,
            Details = $"Assigned to agent {agent.DisplayName}."
        });
    }
}

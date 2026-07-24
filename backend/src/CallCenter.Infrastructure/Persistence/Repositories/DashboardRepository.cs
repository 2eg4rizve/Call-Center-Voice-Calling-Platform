using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Domain.Entities;
using CallCenter.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CallCenter.Infrastructure.Persistence.Repositories;

internal sealed class DashboardRepository(CallCenterDbContext dbContext) : IDashboardRepository
{
    public async Task<DashboardAgentCounts> GetAgentCountsAsync(
        CancellationToken cancellationToken = default)
    {
        var counts = await dbContext.Agents
            .AsNoTracking()
            .GroupBy(_ => 1)
            .Select(group => new DashboardAgentCounts(
                group.Count(),
                group.Count(agent => agent.Status == AgentStatus.Available),
                group.Count(agent => agent.Status == AgentStatus.Busy),
                group.Count(agent => agent.Status == AgentStatus.OnBreak),
                group.Count(agent => agent.Status == AgentStatus.Offline)))
            .SingleOrDefaultAsync(cancellationToken);

        return counts ?? new DashboardAgentCounts(0, 0, 0, 0, 0);
    }

    public async Task<DashboardCallCounts> GetCallCountsAsync(
        DateTimeOffset completedFromUtc,
        DateTimeOffset completedToUtc,
        CancellationToken cancellationToken = default)
    {
        var counts = await dbContext.Calls
            .AsNoTracking()
            .GroupBy(_ => 1)
            .Select(group => new DashboardCallCounts(
                group.Count(call => call.Status == CallStatus.Waiting),
                group.Count(call => call.Status == CallStatus.Assigned),
                group.Count(call => call.Status == CallStatus.Active),
                group.Count(call =>
                    call.Status == CallStatus.Completed &&
                    call.CompletedAtUtc >= completedFromUtc &&
                    call.CompletedAtUtc < completedToUtc)))
            .SingleOrDefaultAsync(cancellationToken);

        return counts ?? new DashboardCallCounts(0, 0, 0, 0);
    }

    public async Task<IReadOnlyCollection<CompletedCallPeriod>> GetCompletedCallPeriodsAsync(
        CancellationToken cancellationToken = default) =>
        await dbContext.Calls
            .AsNoTracking()
            .Where(call =>
                call.Status == CallStatus.Completed &&
                call.AcceptedAtUtc.HasValue &&
                call.CompletedAtUtc.HasValue)
            .Select(call => new CompletedCallPeriod(
                call.AcceptedAtUtc!.Value,
                call.CompletedAtUtc!.Value))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<Agent>> GetAgentStatusSummaryAsync(
        CancellationToken cancellationToken = default) =>
        await dbContext.Agents
            .AsNoTracking()
            .Include(agent => agent.AssignedCalls)
            .OrderBy(agent => agent.DisplayName)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<Call>> GetOperationalCallsAsync(
        CancellationToken cancellationToken = default) =>
        await dbContext.Calls
            .AsNoTracking()
            .Include(call => call.Customer)
            .Include(call => call.CallQueue)
            .Include(call => call.AssignedAgent)
            .Where(call =>
                call.Status == CallStatus.Waiting ||
                call.Status == CallStatus.Assigned ||
                call.Status == CallStatus.Active)
            .OrderBy(call => call.CreatedAtUtc)
            .ToListAsync(cancellationToken);
}

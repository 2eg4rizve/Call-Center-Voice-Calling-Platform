using AutoMapper;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.ResponseDtos;
using CallCenter.Domain.Enums;
using CallCenter.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CallCenter.Infrastructure.Services;

internal sealed class DashboardService(CallCenterDbContext db, IMapper mapper) : IDashboardService
{
    public async Task<DashboardMetricsResponseDto> GetMetricsAsync(
        CancellationToken cancellationToken = default)
    {
        var today = new DateTimeOffset(DateTime.UtcNow.Date, TimeSpan.Zero);
        var tomorrow = today.AddDays(1);
        var agentCounts = await db.Agents.AsNoTracking()
            .GroupBy(_ => 1)
            .Select(group => new
            {
                Total = group.Count(),
                Available = group.Count(x => x.Status == AgentStatus.Available),
                Busy = group.Count(x => x.Status == AgentStatus.Busy),
                OnBreak = group.Count(x => x.Status == AgentStatus.OnBreak),
                Offline = group.Count(x => x.Status == AgentStatus.Offline)
            })
            .SingleOrDefaultAsync(cancellationToken);
        var callCounts = await db.Calls.AsNoTracking()
            .GroupBy(_ => 1)
            .Select(group => new
            {
                Waiting = group.Count(x => x.Status == CallStatus.Waiting),
                Assigned = group.Count(x => x.Status == CallStatus.Assigned),
                Active = group.Count(x => x.Status == CallStatus.Active),
                CompletedToday = group.Count(x => x.Status == CallStatus.Completed &&
                    x.CompletedAtUtc >= today && x.CompletedAtUtc < tomorrow)
            })
            .SingleOrDefaultAsync(cancellationToken);
        var completedDurations = await db.Calls.AsNoTracking()
            .Where(x => x.Status == CallStatus.Completed && x.AcceptedAtUtc.HasValue && x.CompletedAtUtc.HasValue)
            .Select(x => new { x.AcceptedAtUtc, x.CompletedAtUtc })
            .ToListAsync(cancellationToken);

        return new DashboardMetricsResponseDto
        {
            TotalAgents = agentCounts?.Total ?? 0,
            AvailableAgents = agentCounts?.Available ?? 0,
            BusyAgents = agentCounts?.Busy ?? 0,
            OnBreakAgents = agentCounts?.OnBreak ?? 0,
            OfflineAgents = agentCounts?.Offline ?? 0,
            WaitingCalls = callCounts?.Waiting ?? 0,
            AssignedCalls = callCounts?.Assigned ?? 0,
            ActiveCalls = callCounts?.Active ?? 0,
            CompletedCallsToday = callCounts?.CompletedToday ?? 0,
            AverageCompletedCallDurationSeconds = completedDurations.Count == 0
                ? 0
                : completedDurations.Average(x =>
                    (x.CompletedAtUtc!.Value - x.AcceptedAtUtc!.Value).TotalSeconds)
        };
    }

    public async Task<AgentStatusSummaryResponseDto> GetAgentStatusSummaryAsync(
        CancellationToken cancellationToken = default)
    {
        var agents = await db.Agents.AsNoTracking()
            .Include(x => x.AssignedCalls)
            .OrderBy(x => x.DisplayName)
            .ToListAsync(cancellationToken);
        return new AgentStatusSummaryResponseDto
        {
            Agents = mapper.Map<IReadOnlyCollection<AgentSummaryResponseDto>>(agents)
        };
    }

    public async Task<OperationalCallsResponseDto> GetOperationalCallsAsync(
        CancellationToken cancellationToken = default)
    {
        var calls = await db.Calls.AsNoTracking()
            .Include(x => x.Customer)
            .Include(x => x.CallQueue)
            .Include(x => x.AssignedAgent)
            .Where(x => x.Status == CallStatus.Waiting ||
                x.Status == CallStatus.Assigned || x.Status == CallStatus.Active)
            .OrderBy(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);
        return new OperationalCallsResponseDto
        {
            WaitingCalls = mapper.Map<IReadOnlyCollection<CallResponseDto>>(
                calls.Where(x => x.Status == CallStatus.Waiting)),
            ActiveCalls = mapper.Map<IReadOnlyCollection<CallResponseDto>>(
                calls.Where(x => x.Status == CallStatus.Assigned || x.Status == CallStatus.Active))
        };
    }
}

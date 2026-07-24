using CallCenter.Domain.Entities;

namespace CallCenter.Application.Common.Interfaces.Repositories;

public interface IDashboardRepository
{
    Task<DashboardAgentCounts> GetAgentCountsAsync(
        CancellationToken cancellationToken = default);

    Task<DashboardCallCounts> GetCallCountsAsync(
        DateTimeOffset completedFromUtc,
        DateTimeOffset completedToUtc,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<CompletedCallPeriod>> GetCompletedCallPeriodsAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<Agent>> GetAgentStatusSummaryAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<Call>> GetOperationalCallsAsync(
        CancellationToken cancellationToken = default);
}

public sealed record DashboardAgentCounts(
    int Total,
    int Available,
    int Busy,
    int OnBreak,
    int Offline);

public sealed record DashboardCallCounts(
    int Waiting,
    int Assigned,
    int Active,
    int Completed);

public sealed record CompletedCallPeriod(
    DateTimeOffset AcceptedAtUtc,
    DateTimeOffset CompletedAtUtc);

using AutoMapper;
using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.ResponseDtos;
using CallCenter.Domain.Enums;

namespace CallCenter.Application.Services;

internal sealed class DashboardService(
    IDashboardRepository dashboardRepository,
    IMapper mapper) : IDashboardService
{
    public async Task<DashboardMetricsResponseDto> GetMetricsAsync(
        CancellationToken cancellationToken = default)
    {
        var today = new DateTimeOffset(DateTime.UtcNow.Date, TimeSpan.Zero);
        var tomorrow = today.AddDays(1);
        var agentCounts = await dashboardRepository.GetAgentCountsAsync(cancellationToken);
        var callCounts = await dashboardRepository.GetCallCountsAsync(
            today,
            tomorrow,
            cancellationToken);
        var completedCallPeriods = await dashboardRepository
            .GetCompletedCallPeriodsAsync(cancellationToken);

        return new DashboardMetricsResponseDto
        {
            TotalAgents = agentCounts.Total,
            AvailableAgents = agentCounts.Available,
            BusyAgents = agentCounts.Busy,
            OnBreakAgents = agentCounts.OnBreak,
            OfflineAgents = agentCounts.Offline,
            WaitingCalls = callCounts.Waiting,
            AssignedCalls = callCounts.Assigned,
            ActiveCalls = callCounts.Active,
            CompletedCallsToday = callCounts.Completed,
            AverageCompletedCallDurationSeconds = completedCallPeriods.Count == 0
                ? 0
                : completedCallPeriods.Average(period =>
                    (period.CompletedAtUtc - period.AcceptedAtUtc).TotalSeconds)
        };
    }

    public async Task<AgentStatusSummaryResponseDto> GetAgentStatusSummaryAsync(
        CancellationToken cancellationToken = default)
    {
        var agents = await dashboardRepository.GetAgentStatusSummaryAsync(cancellationToken);

        return new AgentStatusSummaryResponseDto
        {
            Agents = mapper.Map<IReadOnlyCollection<AgentSummaryResponseDto>>(agents)
        };
    }

    public async Task<OperationalCallsResponseDto> GetOperationalCallsAsync(
        CancellationToken cancellationToken = default)
    {
        var calls = await dashboardRepository.GetOperationalCallsAsync(cancellationToken);

        return new OperationalCallsResponseDto
        {
            WaitingCalls = mapper.Map<IReadOnlyCollection<CallResponseDto>>(
                calls.Where(call => call.Status == CallStatus.Waiting)),
            ActiveCalls = mapper.Map<IReadOnlyCollection<CallResponseDto>>(
                calls.Where(call =>
                    call.Status == CallStatus.Assigned || call.Status == CallStatus.Active))
        };
    }
}

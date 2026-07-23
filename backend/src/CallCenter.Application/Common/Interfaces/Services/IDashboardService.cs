using CallCenter.Application.Dtos.ResponseDtos;

namespace CallCenter.Application.Common.Interfaces.Services;

public interface IDashboardService
{
    Task<DashboardMetricsResponseDto> GetMetricsAsync(
        CancellationToken cancellationToken = default);

    Task<AgentStatusSummaryResponseDto> GetAgentStatusSummaryAsync(
        CancellationToken cancellationToken = default);

    Task<OperationalCallsResponseDto> GetOperationalCallsAsync(
        CancellationToken cancellationToken = default);
}

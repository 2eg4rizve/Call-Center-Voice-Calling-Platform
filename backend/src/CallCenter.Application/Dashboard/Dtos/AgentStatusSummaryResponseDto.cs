using CallCenter.Domain.Enums;

namespace CallCenter.Application.Dashboard.Dtos;

public sealed class AgentStatusSummaryResponseDto
{
    public int TotalAgents { get; init; }

    public int AvailableCount { get; init; }

    public int BusyCount { get; init; }

    public int OnBreakCount { get; init; }

    public int OfflineCount { get; init; }

    public IReadOnlyDictionary<AgentStatus, int> CountsByStatus { get; init; }
        = new Dictionary<AgentStatus, int>();
}

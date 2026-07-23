namespace CallCenter.Application.Dtos.ResponseDtos;

public sealed class DashboardMetricsResponseDto
{
    public int TotalAgents { get; init; }

    public int AvailableAgents { get; init; }

    public int BusyAgents { get; init; }

    public int OnBreakAgents { get; init; }

    public int OfflineAgents { get; init; }

    public int WaitingCalls { get; init; }

    public int AssignedCalls { get; init; }

    public int ActiveCalls { get; init; }

    public int CompletedCallsToday { get; init; }

    public double AverageCompletedCallDurationSeconds { get; init; }
}

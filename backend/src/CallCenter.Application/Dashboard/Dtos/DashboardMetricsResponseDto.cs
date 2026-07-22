namespace CallCenter.Application.Dashboard.Dtos;

public sealed class DashboardMetricsResponseDto
{
    public int WaitingCallCount { get; init; }

    public int AssignedCallCount { get; init; }

    public int ActiveCallCount { get; init; }

    public int CompletedTodayCount { get; init; }

    public TimeSpan? AverageCompletedCallDuration { get; init; }
}

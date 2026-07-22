namespace CallCenter.Application.Calls.Dtos;

public sealed class CallEventResponseDto
{
    public Guid Id { get; init; }

    public string EventType { get; init; } = string.Empty;

    public DateTimeOffset EventTime { get; init; }

    public string? Details { get; init; }
}

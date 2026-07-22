using CallCenter.Domain.Enums;

namespace CallCenter.Application.Calls.Dtos;

public sealed class CallHistoryResponseDto
{
    public Guid Id { get; init; }

    public string CallReferenceNumber { get; init; } = string.Empty;

    public string CallerPhoneNumber { get; init; } = string.Empty;

    public CallStatus Status { get; init; }

    public string? CustomerName { get; init; }

    public string? AgentDisplayName { get; init; }

    public string QueueName { get; init; } = string.Empty;

    public DateTimeOffset CreatedAt { get; init; }

    public DateTimeOffset? CompletedAt { get; init; }

    public TimeSpan? Duration { get; init; }

    public CallOutcome? Outcome { get; init; }
}

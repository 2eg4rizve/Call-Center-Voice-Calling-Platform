using CallCenter.Domain.Enums;

namespace CallCenter.Application.Dtos.ResponseDtos;

public sealed class CallHistoryResponseDto
{
    public Guid Id { get; init; }

    public string CallReferenceNumber { get; init; } = string.Empty;

    public CallDirection Direction { get; init; }

    public CallStatus Status { get; init; }

    public string? CustomerName { get; init; }

    public string? AgentName { get; init; }

    public string CallQueueName { get; init; } = string.Empty;

    public DateTimeOffset CreatedAtUtc { get; init; }

    public DateTimeOffset? CompletedAtUtc { get; init; }

    public int? DurationSeconds { get; init; }

    public CallOutcome? Outcome { get; init; }

    public CrmSyncStatus CrmSyncStatus { get; init; }
}

using CallCenter.Domain.Enums;

namespace CallCenter.Application.Calls.Dtos;

public sealed class CallResponseDto
{
    public Guid Id { get; init; }

    public string CallReferenceNumber { get; init; } = string.Empty;

    public CallDirection Direction { get; init; }

    public CallStatus Status { get; init; }

    public string CallerPhoneNumber { get; init; } = string.Empty;

    public Guid? CustomerId { get; init; }

    public Guid CallQueueId { get; init; }

    public Guid? AssignedAgentId { get; init; }

    public DateTimeOffset CreatedAtUtc { get; init; }

    public DateTimeOffset? AssignedAtUtc { get; init; }

    public DateTimeOffset? AcceptedAtUtc { get; init; }

    public DateTimeOffset? CompletedAtUtc { get; init; }

    public CallOutcome? Outcome { get; init; }

    public string? Notes { get; init; }

    public CrmSyncStatus CrmSyncStatus { get; init; }

    public int? DurationSeconds { get; init; }
}

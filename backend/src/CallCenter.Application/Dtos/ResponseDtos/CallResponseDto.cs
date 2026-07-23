using CallCenter.Domain.Enums;

namespace CallCenter.Application.Dtos.ResponseDtos;

public class CallResponseDto
{
    public Guid Id { get; init; }

    public string CallReferenceNumber { get; init; } = string.Empty;

    public CallDirection Direction { get; init; }

    public CallStatus Status { get; init; }

    public CustomerResponseDto? Customer { get; init; }

    public Guid CallQueueId { get; init; }

    public string CallQueueName { get; init; } = string.Empty;

    public Guid? AssignedAgentId { get; init; }

    public string? AssignedAgentName { get; init; }

    public DateTimeOffset CreatedAtUtc { get; init; }

    public DateTimeOffset? AssignedAtUtc { get; init; }

    public DateTimeOffset? AcceptedAtUtc { get; init; }

    public DateTimeOffset? CompletedAtUtc { get; init; }

    public CallOutcome? Outcome { get; init; }

    public string? Notes { get; init; }

    public CrmSyncStatus CrmSyncStatus { get; init; }

    public int? DurationSeconds { get; init; }
}

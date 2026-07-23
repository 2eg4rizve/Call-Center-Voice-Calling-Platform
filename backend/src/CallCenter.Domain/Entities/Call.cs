using CallCenter.Domain.Common;
using CallCenter.Domain.Enums;

namespace CallCenter.Domain.Entities;

public sealed class Call : BaseEntity
{
    public string CallReferenceNumber { get; set; } = string.Empty;

    public CallDirection Direction { get; set; } = CallDirection.Inbound;

    public CallStatus Status { get; set; } = CallStatus.Waiting;

    public string CallerPhoneNumber { get; set; } = string.Empty;

    public Guid? CustomerId { get; set; }

    public Customer? Customer { get; set; }

    public Guid CallQueueId { get; set; }

    public CallQueue CallQueue { get; set; } = null!;

    public Guid? AssignedAgentId { get; set; }

    public Agent? AssignedAgent { get; set; }

    public DateTimeOffset? AssignedAtUtc { get; set; }

    public DateTimeOffset? AcceptedAtUtc { get; set; }

    public DateTimeOffset? CompletedAtUtc { get; set; }

    public CallOutcome? Outcome { get; set; }

    public string? Notes { get; set; }

    public CrmSyncStatus CrmSyncStatus { get; set; } = CrmSyncStatus.Pending;

    public ICollection<CallEvent> CallEvents { get; set; } = [];

    public int? DurationSeconds =>
        AcceptedAtUtc.HasValue && CompletedAtUtc.HasValue
            ? (int)(CompletedAtUtc.Value - AcceptedAtUtc.Value).TotalSeconds
            : null;
}

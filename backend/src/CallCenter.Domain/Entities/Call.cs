using CallCenter.Domain.Common;
using CallCenter.Domain.Enums;

namespace CallCenter.Domain.Entities;

public sealed class Call : BaseEntity
{
    public string CallReferenceNumber { get; set; } = string.Empty;

    public CallDirection Direction { get; set; }

    public CallStatus Status { get; set; }

    public string CallerPhoneNumber { get; set; } = string.Empty;

    public Guid? CustomerId { get; set; }

    public Guid QueueId { get; set; }

    public Guid? AssignedAgentId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? AssignedAt { get; set; }

    public DateTimeOffset? AcceptedAt { get; set; }

    public DateTimeOffset? CompletedAt { get; set; }

    public CallOutcome? Outcome { get; set; }

    public string? Notes { get; set; }

    public CrmSyncStatus CrmSyncStatus { get; set; }
}

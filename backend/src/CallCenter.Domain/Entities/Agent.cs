using CallCenter.Domain.Common;
using CallCenter.Domain.Enums;

namespace CallCenter.Domain.Entities;

public sealed class Agent : BaseEntity
{
    public string IdentityUserId { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public AgentStatus Status { get; set; } = AgentStatus.Offline;

    public DateTimeOffset? LastAvailableAtUtc { get; set; }

    public ICollection<AgentQueue> AgentQueues { get; set; } = [];

    public ICollection<Call> AssignedCalls { get; set; } = [];
}

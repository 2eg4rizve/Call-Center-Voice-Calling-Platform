using CallCenter.Domain.Common;
using CallCenter.Domain.Enums;

namespace CallCenter.Domain.Entities;

public sealed class Agent : BaseEntity
{
    public string IdentityUserId { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public AgentStatus Status { get; set; }

    public DateTimeOffset? LastAvailableAt { get; set; }

    public Guid? CurrentActiveCallId { get; set; }
}

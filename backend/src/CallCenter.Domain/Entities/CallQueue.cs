using CallCenter.Domain.Common;

namespace CallCenter.Domain.Entities;

public sealed class CallQueue : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<AgentQueue> AgentQueues { get; set; } = [];

    public ICollection<Call> Calls { get; set; } = [];
}

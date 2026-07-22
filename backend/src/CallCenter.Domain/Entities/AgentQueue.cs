using CallCenter.Domain.Common;

namespace CallCenter.Domain.Entities;

public sealed class AgentQueue : BaseEntity
{
    public Guid AgentId { get; set; }

    public Guid QueueId { get; set; }
}

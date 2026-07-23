using CallCenter.Domain.Common;

namespace CallCenter.Domain.Entities;

public sealed class AgentQueue : BaseEntity
{
    public Guid AgentId { get; set; }

    public Agent Agent { get; set; } = null!;

    public Guid CallQueueId { get; set; }

    public CallQueue CallQueue { get; set; } = null!;
}

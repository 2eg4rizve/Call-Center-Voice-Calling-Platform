using CallCenter.Domain.Common;

namespace CallCenter.Domain.Entities;

public sealed class CallEvent : BaseEntity
{
    public Guid CallId { get; set; }

    public string EventType { get; set; } = string.Empty;

    public DateTimeOffset EventTime { get; set; }

    public string? Details { get; set; }
}

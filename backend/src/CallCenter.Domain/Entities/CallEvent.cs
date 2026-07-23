using CallCenter.Domain.Common;
using CallCenter.Domain.Enums;

namespace CallCenter.Domain.Entities;

public sealed class CallEvent : BaseEntity
{
    public Guid CallId { get; set; }

    public Call Call { get; set; } = null!;

    public CallEventType EventType { get; set; }

    public DateTimeOffset EventAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public string? Details { get; set; }
}

using CallCenter.Domain.Common;

namespace CallCenter.Domain.Entities;

public sealed class Queue : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public bool IsActive { get; set; }
}

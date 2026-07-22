using CallCenter.Domain.Common;

namespace CallCenter.Domain.Entities;

public sealed class Customer : BaseEntity
{
    public string CustomerReferenceNumber { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string EmailAddress { get; set; } = string.Empty;

    public string CustomerCategory { get; set; } = string.Empty;

    public string RecentInteractionSummary { get; set; } = string.Empty;
}

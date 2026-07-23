namespace CallCenter.Application.Dtos.ResponseDtos;

public sealed class CustomerResponseDto
{
    public Guid Id { get; init; }

    public string CustomerReferenceNumber { get; init; } = string.Empty;

    public string Name { get; init; } = string.Empty;

    public string? EmailAddress { get; init; }

    public string? CustomerCategory { get; init; }

    public string? RecentInteractionSummary { get; init; }

    public bool IsKnownCustomer { get; init; } = true;
}

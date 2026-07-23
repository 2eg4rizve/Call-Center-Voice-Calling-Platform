using System.ComponentModel.DataAnnotations;

namespace CallCenter.Application.Dtos.RequestDtos;

public sealed class CreateCustomerRequestDto
{
    [Required, StringLength(200)]
    public string Name { get; init; } = string.Empty;

    [Required, Phone, StringLength(30)]
    public string PhoneNumber { get; init; } = string.Empty;

    [EmailAddress, StringLength(256)]
    public string? EmailAddress { get; init; }

    [StringLength(100)]
    public string? CustomerCategory { get; init; }

    [StringLength(1000)]
    public string? RecentInteractionSummary { get; init; }
}

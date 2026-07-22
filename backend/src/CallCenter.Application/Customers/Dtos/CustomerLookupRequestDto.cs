using System.ComponentModel.DataAnnotations;

namespace CallCenter.Application.Customers.Dtos;

public sealed class CustomerLookupRequestDto
{
    [Required, Phone]
    public string PhoneNumber { get; init; } = string.Empty;
}

using System.ComponentModel.DataAnnotations;

namespace CallCenter.Application.Dtos.RequestDtos;

public sealed class CustomerLookupRequestDto
{
    [Required, Phone]
    public string PhoneNumber { get; init; } = string.Empty;
}

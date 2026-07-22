using System.ComponentModel.DataAnnotations;

namespace CallCenter.Application.Calls.Dtos;

public sealed class CreateCallRequestDto
{
    [Required, Phone]
    public string CallerPhoneNumber { get; init; } = string.Empty;

    [Required]
    public Guid QueueId { get; init; }
}

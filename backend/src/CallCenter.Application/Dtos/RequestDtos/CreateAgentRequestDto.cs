using System.ComponentModel.DataAnnotations;

namespace CallCenter.Application.Dtos.RequestDtos;

public sealed class CreateAgentRequestDto
{
    [Required, StringLength(150)]
    public string FullName { get; init; } = string.Empty;

    [Required, EmailAddress, StringLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, MinLength(8), StringLength(100)]
    public string Password { get; init; } = string.Empty;

    [Required, StringLength(150)]
    public string DisplayName { get; init; } = string.Empty;
}

using System.ComponentModel.DataAnnotations;

namespace CallCenter.Application.Dtos.RequestDtos;

public sealed class CreateAgentRequestDto
{
    [Required, StringLength(150)]
    public string FullName { get; init; } = string.Empty;

    [Required, EmailAddress, StringLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, MinLength(8), StringLength(100)]
    [RegularExpression(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).+$",
        ErrorMessage = "Password must contain at least one lowercase letter, one uppercase letter, and one non-alphanumeric character.")]
    public string Password { get; init; } = string.Empty;

    [Required, StringLength(150)]
    public string DisplayName { get; init; } = string.Empty;
}

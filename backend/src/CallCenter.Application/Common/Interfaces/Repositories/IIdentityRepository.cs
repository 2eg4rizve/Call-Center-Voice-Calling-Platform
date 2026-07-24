namespace CallCenter.Application.Common.Interfaces.Repositories;

public interface IIdentityRepository
{
    Task<bool> EmailExistsAsync(
        string email,
        CancellationToken cancellationToken = default);

    Task<IdentityCreationResult> CreateAgentAsync(
        string fullName,
        string email,
        string password,
        CancellationToken cancellationToken = default);

    Task<AuthenticatedIdentity?> AuthenticateAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default);
}

public sealed record IdentityCreationResult(
    bool Succeeded,
    string? IdentityUserId,
    IReadOnlyCollection<string> Errors);

public sealed record AuthenticatedIdentity(
    string IdentityUserId,
    string FullName,
    string Email,
    string Role);

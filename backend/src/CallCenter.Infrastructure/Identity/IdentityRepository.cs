using CallCenter.Application.Common.Interfaces.Repositories;
using Microsoft.AspNetCore.Identity;

namespace CallCenter.Infrastructure.Identity;

internal sealed class IdentityRepository(UserManager<ApplicationUser> userManager)
    : IIdentityRepository
{
    public async Task<bool> EmailExistsAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await userManager.FindByEmailAsync(email) is not null;
    }

    public async Task<IdentityCreationResult> CreateAgentAsync(
        string fullName,
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = fullName,
            EmailConfirmed = true
        };
        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
            return Failed(createResult.Errors);

        cancellationToken.ThrowIfCancellationRequested();
        var roleResult = await userManager.AddToRoleAsync(user, "Agent");
        if (roleResult.Succeeded)
            return new IdentityCreationResult(true, user.Id, []);

        await userManager.DeleteAsync(user);
        return Failed(roleResult.Errors);
    }

    public async Task<AuthenticatedIdentity?> AuthenticateAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await userManager.FindByEmailAsync(email);
        if (user is null || !await userManager.CheckPasswordAsync(user, password))
            return null;

        cancellationToken.ThrowIfCancellationRequested();
        var roles = await userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault()
            ?? throw new UnauthorizedAccessException("User has no assigned role.");

        return new AuthenticatedIdentity(
            user.Id,
            user.FullName,
            user.Email ?? email,
            role);
    }

    private static IdentityCreationResult Failed(IEnumerable<IdentityError> errors) =>
        new(false, null, errors.Select(error => error.Description).ToArray());
}

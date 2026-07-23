using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Application.Dtos.ResponseDtos;
using CallCenter.Domain.Entities;
using CallCenter.Infrastructure.Identity;
using CallCenter.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CallCenter.Infrastructure.Services;

internal sealed class AuthService(UserManager<ApplicationUser> userManager, CallCenterDbContext db, IOptions<JwtOptions> options) : IAuthService
{
    public async Task<LoginResponseDto> SignupAsync(SignupRequestDto request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim();
        if (await userManager.FindByEmailAsync(email) is not null)
            throw new ArgumentException("An account with this email already exists.");

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = request.FullName.Trim(),
            EmailConfirmed = true
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
            throw new ArgumentException(string.Join("; ", createResult.Errors.Select(error => error.Description)));

        try
        {
            var roleResult = await userManager.AddToRoleAsync(user, "Agent");
            if (!roleResult.Succeeded)
                throw new InvalidOperationException(string.Join("; ", roleResult.Errors.Select(error => error.Description)));

            var agent = new Agent
            {
                IdentityUserId = user.Id,
                DisplayName = request.DisplayName.Trim(),
                Status = CallCenter.Domain.Enums.AgentStatus.Offline
            };

            db.Agents.Add(agent);
            await db.SaveChangesAsync(cancellationToken);
            return CreateLoginResponse(user, "Agent", agent.Id);
        }
        catch
        {
            await userManager.DeleteAsync(user);
            throw;
        }
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
            throw new UnauthorizedAccessException("Invalid email or password.");

        var roles = await userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? throw new UnauthorizedAccessException("User has no assigned role.");
        var agent = await db.Agents.AsNoTracking().FirstOrDefaultAsync(x => x.IdentityUserId == user.Id, cancellationToken);
        return CreateLoginResponse(user, role, agent?.Id);
    }

    private LoginResponseDto CreateLoginResponse(ApplicationUser user, string role, Guid? agentId)
    {
        var expires = DateTimeOffset.UtcNow.AddMinutes(options.Value.ExpiryMinutes);
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, user.Id), new(ClaimTypes.Email, user.Email!), new(ClaimTypes.Name, user.FullName), new(ClaimTypes.Role, role) };
        if (agentId.HasValue) claims.Add(new Claim("agent_id", agentId.Value.ToString()));
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Value.Key)), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(options.Value.Issuer, options.Value.Audience, claims, expires: expires.UtcDateTime, signingCredentials: credentials);
        return new LoginResponseDto { AccessToken = new JwtSecurityTokenHandler().WriteToken(token), ExpiresAt = expires, UserId = user.Id, DisplayName = user.FullName, Email = user.Email!, Role = role, AgentId = agentId };
    }
}

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
    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
            throw new UnauthorizedAccessException("Invalid email or password.");

        var roles = await userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? throw new UnauthorizedAccessException("User has no assigned role.");
        var agent = await db.Agents.AsNoTracking().FirstOrDefaultAsync(x => x.IdentityUserId == user.Id, cancellationToken);
        var expires = DateTimeOffset.UtcNow.AddMinutes(options.Value.ExpiryMinutes);
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, user.Id), new(ClaimTypes.Email, user.Email!), new(ClaimTypes.Name, user.FullName), new(ClaimTypes.Role, role) };
        if (agent is not null) claims.Add(new Claim("agent_id", agent.Id.ToString()));
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Value.Key)), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(options.Value.Issuer, options.Value.Audience, claims, expires: expires.UtcDateTime, signingCredentials: credentials);
        return new LoginResponseDto { AccessToken = new JwtSecurityTokenHandler().WriteToken(token), ExpiresAt = expires, UserId = user.Id, DisplayName = user.FullName, Email = user.Email!, Role = role, AgentId = agent?.Id };
    }
}

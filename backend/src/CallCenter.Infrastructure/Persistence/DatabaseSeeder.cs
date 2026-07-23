using CallCenter.Domain.Entities;
using CallCenter.Domain.Enums;
using CallCenter.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CallCenter.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider provider)
    {
        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CallCenterDbContext>();
        await db.Database.MigrateAsync();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        foreach (var role in new[] { "Supervisor", "Agent" }) if (!await roles.RoleExistsAsync(role)) await roles.CreateAsync(new IdentityRole(role));
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        await EnsureUser(users, db, "supervisor@callcenter.local", "Supervisor Demo", "Supervisor", null);
        await EnsureUser(users, db, "agent1@callcenter.local", "Agent One", "Agent", "Agent One");
        await EnsureUser(users, db, "agent2@callcenter.local", "Agent Two", "Agent", "Agent Two");
        await db.SaveChangesAsync();
    }

    private static async Task EnsureUser(UserManager<ApplicationUser> users, CallCenterDbContext db, string email, string name, string role, string? agentName)
    {
        var user = await users.FindByEmailAsync(email);
        if (user is null) { user = new ApplicationUser { UserName = email, Email = email, FullName = name, EmailConfirmed = true }; var result = await users.CreateAsync(user, "Demo@12345"); if (!result.Succeeded) throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description))); }
        if (!await users.IsInRoleAsync(user, role)) await users.AddToRoleAsync(user, role);
        if (agentName is not null && !await db.Agents.AnyAsync(x => x.IdentityUserId == user.Id)) db.Agents.Add(new Agent { IdentityUserId = user.Id, DisplayName = agentName, Status = AgentStatus.Available, LastAvailableAtUtc = DateTimeOffset.UtcNow });
    }
}

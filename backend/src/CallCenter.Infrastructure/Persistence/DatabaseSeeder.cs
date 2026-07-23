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
        await EnsureDemoData(db);
        await db.SaveChangesAsync();
    }

    private static async Task EnsureUser(UserManager<ApplicationUser> users, CallCenterDbContext db, string email, string name, string role, string? agentName)
    {
        var user = await users.FindByEmailAsync(email);
        if (user is null) { user = new ApplicationUser { UserName = email, Email = email, FullName = name, EmailConfirmed = true }; var result = await users.CreateAsync(user, "Demo@12345"); if (!result.Succeeded) throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description))); }
        if (!await users.IsInRoleAsync(user, role)) await users.AddToRoleAsync(user, role);
        if (agentName is not null && !await db.Agents.AnyAsync(x => x.IdentityUserId == user.Id)) db.Agents.Add(new Agent { IdentityUserId = user.Id, DisplayName = agentName, Status = AgentStatus.Available, LastAvailableAtUtc = DateTimeOffset.UtcNow });
    }

    private static async Task EnsureDemoData(CallCenterDbContext db)
    {
        var supportQueue = await EnsureQueue(db, "Customer Support", "General customer-support calls");
        var priorityQueue = await EnsureQueue(db, "Priority Support", "Priority customer calls");
        await db.SaveChangesAsync();

        var agents = await db.Agents.OrderBy(agent => agent.DisplayName).Take(2).ToListAsync();
        foreach (var agent in agents)
        {
            foreach (var queue in new[] { supportQueue, priorityQueue })
            {
                if (!await db.AgentQueues.AnyAsync(x => x.AgentId == agent.Id && x.CallQueueId == queue.Id))
                    db.AgentQueues.Add(new AgentQueue { AgentId = agent.Id, CallQueueId = queue.Id });
            }
        }

        await EnsureCustomer(
            db,
            "CUS-DEMO-001",
            "Demo Customer",
            "+8801700000000",
            "customer@example.com",
            "Regular",
            "Asked about account services.");
        await EnsureCustomer(
            db,
            "CUS-DEMO-002",
            "Priority Customer",
            "+8801800000000",
            "priority@example.com",
            "Priority",
            "Requested a priority follow-up.");
    }

    private static async Task<CallQueue> EnsureQueue(
        CallCenterDbContext db,
        string name,
        string description)
    {
        var queue = await db.CallQueues.SingleOrDefaultAsync(x => x.Name == name);
        if (queue is not null) return queue;

        queue = new CallQueue { Name = name, Description = description, IsActive = true };
        db.CallQueues.Add(queue);
        return queue;
    }

    private static async Task EnsureCustomer(
        CallCenterDbContext db,
        string reference,
        string name,
        string phoneNumber,
        string email,
        string category,
        string summary)
    {
        if (await db.Customers.AnyAsync(x => x.PhoneNumber == phoneNumber)) return;

        db.Customers.Add(new Customer
        {
            CustomerReferenceNumber = reference,
            Name = name,
            PhoneNumber = phoneNumber,
            EmailAddress = email,
            CustomerCategory = category,
            RecentInteractionSummary = summary
        });
    }
}

using CallCenter.Domain.Entities;
using CallCenter.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CallCenter.Infrastructure.Persistence;

public sealed class CallCenterDbContext(DbContextOptions<CallCenterDbContext> options)
    : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Agent> Agents => Set<Agent>();

    public DbSet<Customer> Customers => Set<Customer>();

    public DbSet<CallQueue> CallQueues => Set<CallQueue>();

    public DbSet<AgentQueue> AgentQueues => Set<AgentQueue>();

    public DbSet<Call> Calls => Set<Call>();

    public DbSet<CallEvent> CallEvents => Set<CallEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CallCenterDbContext).Assembly);
    }
}

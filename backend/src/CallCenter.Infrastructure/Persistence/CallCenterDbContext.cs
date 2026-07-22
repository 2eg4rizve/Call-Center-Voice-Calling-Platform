using Microsoft.EntityFrameworkCore;

namespace CallCenter.Infrastructure.Persistence;

public sealed class CallCenterDbContext(DbContextOptions<CallCenterDbContext> options)
    : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CallCenterDbContext).Assembly);
    }
}

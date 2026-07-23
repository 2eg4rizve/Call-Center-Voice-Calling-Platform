using CallCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CallCenter.Infrastructure.Persistence.Configurations;

internal sealed class AgentConfiguration : IEntityTypeConfiguration<Agent>
{
    public void Configure(EntityTypeBuilder<Agent> builder)
    {
        builder.ToTable("Agents");
        builder.HasKey(agent => agent.Id);

        builder.Property(agent => agent.IdentityUserId)
            .HasMaxLength(450)
            .IsRequired();
        builder.HasIndex(agent => agent.IdentityUserId).IsUnique();

        builder.Property(agent => agent.DisplayName)
            .HasMaxLength(150)
            .IsRequired();
        builder.Property(agent => agent.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(agent => new { agent.Status, agent.LastAvailableAtUtc });
    }
}

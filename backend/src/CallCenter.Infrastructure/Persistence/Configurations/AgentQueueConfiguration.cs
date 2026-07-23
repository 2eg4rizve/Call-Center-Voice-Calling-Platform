using CallCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CallCenter.Infrastructure.Persistence.Configurations;

internal sealed class AgentQueueConfiguration : IEntityTypeConfiguration<AgentQueue>
{
    public void Configure(EntityTypeBuilder<AgentQueue> builder)
    {
        builder.ToTable("AgentQueues");
        builder.HasKey(agentQueue => agentQueue.Id);
        builder.HasIndex(agentQueue => new { agentQueue.AgentId, agentQueue.CallQueueId }).IsUnique();

        builder.HasOne(agentQueue => agentQueue.Agent)
            .WithMany(agent => agent.AgentQueues)
            .HasForeignKey(agentQueue => agentQueue.AgentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(agentQueue => agentQueue.CallQueue)
            .WithMany(callQueue => callQueue.AgentQueues)
            .HasForeignKey(agentQueue => agentQueue.CallQueueId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

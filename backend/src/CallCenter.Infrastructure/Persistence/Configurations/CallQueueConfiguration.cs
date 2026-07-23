using CallCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CallCenter.Infrastructure.Persistence.Configurations;

internal sealed class CallQueueConfiguration : IEntityTypeConfiguration<CallQueue>
{
    public void Configure(EntityTypeBuilder<CallQueue> builder)
    {
        builder.ToTable("CallQueues");
        builder.HasKey(callQueue => callQueue.Id);

        builder.Property(callQueue => callQueue.Name).HasMaxLength(150).IsRequired();
        builder.HasIndex(callQueue => callQueue.Name).IsUnique();
        builder.Property(callQueue => callQueue.Description).HasMaxLength(500);
    }
}

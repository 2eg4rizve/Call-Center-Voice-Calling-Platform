using CallCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CallCenter.Infrastructure.Persistence.Configurations;

internal sealed class CallEventConfiguration : IEntityTypeConfiguration<CallEvent>
{
    public void Configure(EntityTypeBuilder<CallEvent> builder)
    {
        builder.ToTable("CallEvents");
        builder.HasKey(callEvent => callEvent.Id);

        builder.Property(callEvent => callEvent.EventType)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();
        builder.Property(callEvent => callEvent.Details).HasMaxLength(2000);
        builder.HasIndex(callEvent => new { callEvent.CallId, callEvent.EventAtUtc });

        builder.HasOne(callEvent => callEvent.Call)
            .WithMany(call => call.CallEvents)
            .HasForeignKey(callEvent => callEvent.CallId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

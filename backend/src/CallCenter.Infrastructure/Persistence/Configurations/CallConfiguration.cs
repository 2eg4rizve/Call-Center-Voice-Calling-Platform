using CallCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CallCenter.Infrastructure.Persistence.Configurations;

internal sealed class CallConfiguration : IEntityTypeConfiguration<Call>
{
    public void Configure(EntityTypeBuilder<Call> builder)
    {
        builder.ToTable("Calls");
        builder.HasKey(call => call.Id);

        builder.Property(call => call.CallReferenceNumber).HasMaxLength(50).IsRequired();
        builder.HasIndex(call => call.CallReferenceNumber).IsUnique();
        builder.Property(call => call.Direction).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(call => call.Status).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(call => call.CallerPhoneNumber).HasMaxLength(30).IsRequired();
        builder.Property(call => call.Outcome).HasConversion<string>().HasMaxLength(40);
        builder.Property(call => call.Notes).HasMaxLength(2000);
        builder.Property(call => call.CrmSyncStatus).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Ignore(call => call.DurationSeconds);

        builder.HasIndex(call => new { call.Status, call.CallQueueId, call.CreatedAtUtc });
        builder.HasIndex(call => new { call.AssignedAgentId, call.Status });

        builder.HasOne(call => call.Customer)
            .WithMany(customer => customer.Calls)
            .HasForeignKey(call => call.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(call => call.CallQueue)
            .WithMany(callQueue => callQueue.Calls)
            .HasForeignKey(call => call.CallQueueId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(call => call.AssignedAgent)
            .WithMany(agent => agent.AssignedCalls)
            .HasForeignKey(call => call.AssignedAgentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

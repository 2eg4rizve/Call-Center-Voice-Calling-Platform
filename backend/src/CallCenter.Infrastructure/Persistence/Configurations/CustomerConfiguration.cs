using CallCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CallCenter.Infrastructure.Persistence.Configurations;

internal sealed class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("Customers");
        builder.HasKey(customer => customer.Id);

        builder.Property(customer => customer.CustomerReferenceNumber)
            .HasMaxLength(50)
            .IsRequired();
        builder.HasIndex(customer => customer.CustomerReferenceNumber).IsUnique();

        builder.Property(customer => customer.Name).HasMaxLength(200).IsRequired();
        builder.Property(customer => customer.PhoneNumber).HasMaxLength(30).IsRequired();
        builder.HasIndex(customer => customer.PhoneNumber);

        builder.Property(customer => customer.EmailAddress).HasMaxLength(256);
        builder.Property(customer => customer.CustomerCategory).HasMaxLength(100);
        builder.Property(customer => customer.RecentInteractionSummary).HasMaxLength(1000);
    }
}

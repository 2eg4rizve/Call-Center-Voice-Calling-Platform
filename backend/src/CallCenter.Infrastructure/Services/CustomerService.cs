using AutoMapper;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Application.Dtos.ResponseDtos;
using CallCenter.Domain.Entities;
using CallCenter.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CallCenter.Infrastructure.Services;

internal sealed class CustomerService(CallCenterDbContext db, IMapper mapper) : ICustomerService
{
    public async Task<CustomerResponseDto> CreateAsync(
        CreateCustomerRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var phoneNumber = request.PhoneNumber.Trim();
        if (await db.Customers.AnyAsync(customer => customer.PhoneNumber == phoneNumber, cancellationToken))
            throw new ArgumentException("A customer with this phone number already exists.");

        var customer = new Customer
        {
            CustomerReferenceNumber = $"CUS-{Guid.NewGuid():N}"[..16].ToUpperInvariant(),
            Name = request.Name.Trim(),
            PhoneNumber = phoneNumber,
            EmailAddress = NormalizeOptional(request.EmailAddress),
            CustomerCategory = NormalizeOptional(request.CustomerCategory),
            RecentInteractionSummary = NormalizeOptional(request.RecentInteractionSummary)
        };

        db.Customers.Add(customer);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<CustomerResponseDto>(customer);
    }

    public async Task<CustomerResponseDto> UpdateAsync(
        Guid customerId,
        UpdateCustomerRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var customer = await db.Customers.SingleOrDefaultAsync(x => x.Id == customerId, cancellationToken)
            ?? throw new KeyNotFoundException("Customer was not found.");

        customer.Name = request.Name.Trim();
        customer.EmailAddress = NormalizeOptional(request.EmailAddress);
        customer.CustomerCategory = NormalizeOptional(request.CustomerCategory);
        customer.RecentInteractionSummary = NormalizeOptional(request.RecentInteractionSummary);
        customer.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<CustomerResponseDto>(customer);
    }

    public async Task<CustomerResponseDto> GetByIdAsync(
        Guid customerId,
        CancellationToken cancellationToken = default)
    {
        var customer = await db.Customers.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == customerId, cancellationToken)
            ?? throw new KeyNotFoundException("Customer was not found.");
        return mapper.Map<CustomerResponseDto>(customer);
    }

    public async Task<CustomerResponseDto> LookupAsync(
        CustomerLookupRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var phoneNumber = request.PhoneNumber.Trim();
        var customer = await db.Customers.AsNoTracking()
            .SingleOrDefaultAsync(x => x.PhoneNumber == phoneNumber, cancellationToken)
            ?? throw new KeyNotFoundException("Customer was not found.");
        return mapper.Map<CustomerResponseDto>(customer);
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

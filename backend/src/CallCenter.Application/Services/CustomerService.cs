using AutoMapper;
using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Application.Dtos.ResponseDtos;
using CallCenter.Domain.Entities;

namespace CallCenter.Application.Services;

internal sealed class CustomerService(
    ICustomerRepository customerRepository,
    IUnitOfWork unitOfWork,
    IMapper mapper) : ICustomerService
{
    public async Task<CustomerResponseDto> CreateAsync(
        CreateCustomerRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var phoneNumber = request.PhoneNumber.Trim();
        var existingCustomer = await customerRepository.GetByPhoneNumberAsync(
            phoneNumber,
            cancellationToken);

        if (existingCustomer is not null)
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

        await customerRepository.AddAsync(customer, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return mapper.Map<CustomerResponseDto>(customer);
    }

    public async Task<CustomerResponseDto> UpdateAsync(
        Guid customerId,
        UpdateCustomerRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var customer = await customerRepository.GetByIdAsync(customerId, cancellationToken)
            ?? throw new KeyNotFoundException("Customer was not found.");

        customer.Name = request.Name.Trim();
        customer.EmailAddress = NormalizeOptional(request.EmailAddress);
        customer.CustomerCategory = NormalizeOptional(request.CustomerCategory);
        customer.RecentInteractionSummary = NormalizeOptional(request.RecentInteractionSummary);
        customer.UpdatedAtUtc = DateTimeOffset.UtcNow;

        customerRepository.Update(customer);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return mapper.Map<CustomerResponseDto>(customer);
    }

    public async Task<CustomerResponseDto> GetByIdAsync(
        Guid customerId,
        CancellationToken cancellationToken = default)
    {
        var customer = await customerRepository.GetByIdAsync(customerId, cancellationToken)
            ?? throw new KeyNotFoundException("Customer was not found.");

        return mapper.Map<CustomerResponseDto>(customer);
    }

    public async Task<CustomerResponseDto> LookupAsync(
        CustomerLookupRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var customer = await customerRepository.GetByPhoneNumberAsync(
                request.PhoneNumber.Trim(),
                cancellationToken)
            ?? throw new KeyNotFoundException("Customer was not found.");

        return mapper.Map<CustomerResponseDto>(customer);
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

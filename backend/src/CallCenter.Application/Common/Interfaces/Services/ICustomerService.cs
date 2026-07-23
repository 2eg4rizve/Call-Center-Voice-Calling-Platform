using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Application.Dtos.ResponseDtos;

namespace CallCenter.Application.Common.Interfaces.Services;

public interface ICustomerService
{
    Task<CustomerResponseDto> CreateAsync(
        CreateCustomerRequestDto request,
        CancellationToken cancellationToken = default);

    Task<CustomerResponseDto> UpdateAsync(
        Guid customerId,
        UpdateCustomerRequestDto request,
        CancellationToken cancellationToken = default);

    Task<CustomerResponseDto> GetByIdAsync(
        Guid customerId,
        CancellationToken cancellationToken = default);

    Task<CustomerResponseDto> LookupAsync(
        CustomerLookupRequestDto request,
        CancellationToken cancellationToken = default);
}

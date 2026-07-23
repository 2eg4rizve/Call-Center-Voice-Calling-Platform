using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Application.Dtos.ResponseDtos;

namespace CallCenter.Application.Common.Interfaces.Services;

public interface ICallQueueService
{
    Task<CallQueueResponseDto> CreateAsync(
        CreateCallQueueRequestDto request,
        CancellationToken cancellationToken = default);

    Task<CallQueueResponseDto> UpdateAsync(
        Guid callQueueId,
        UpdateCallQueueRequestDto request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<CallQueueResponseDto>> GetActiveAsync(
        CancellationToken cancellationToken = default);
}

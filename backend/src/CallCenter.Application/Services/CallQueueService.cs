using AutoMapper;
using CallCenter.Application.Common.Interfaces.Repositories;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Application.Dtos.ResponseDtos;
using CallCenter.Domain.Entities;

namespace CallCenter.Application.Services;

internal sealed class CallQueueService(
    ICallQueueRepository callQueueRepository,
    IUnitOfWork unitOfWork,
    IMapper mapper) : ICallQueueService
{
    public async Task<CallQueueResponseDto> CreateAsync(
        CreateCallQueueRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var name = request.Name.Trim();
        var existingQueue = await callQueueRepository.GetByNameAsync(name, cancellationToken);

        if (existingQueue is not null)
            throw new ArgumentException("A call queue with this name already exists.");

        var queue = new CallQueue
        {
            Name = name,
            Description = NormalizeOptional(request.Description)
        };

        await callQueueRepository.AddAsync(queue, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return mapper.Map<CallQueueResponseDto>(queue);
    }

    public async Task<CallQueueResponseDto> UpdateAsync(
        Guid callQueueId,
        UpdateCallQueueRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var queue = await callQueueRepository.GetByIdAsync(callQueueId, cancellationToken)
            ?? throw new KeyNotFoundException("Call queue was not found.");

        var name = request.Name.Trim();
        var queueWithSameName = await callQueueRepository.GetByNameAsync(name, cancellationToken);

        if (queueWithSameName is not null && queueWithSameName.Id != callQueueId)
            throw new ArgumentException("A call queue with this name already exists.");

        queue.Name = name;
        queue.Description = NormalizeOptional(request.Description);
        queue.IsActive = request.IsActive;
        queue.UpdatedAtUtc = DateTimeOffset.UtcNow;

        callQueueRepository.Update(queue);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return mapper.Map<CallQueueResponseDto>(queue);
    }

    public async Task<IReadOnlyCollection<CallQueueResponseDto>> GetActiveAsync(
        CancellationToken cancellationToken = default)
    {
        var queues = await callQueueRepository.GetActiveAsync(cancellationToken);
        return mapper.Map<IReadOnlyCollection<CallQueueResponseDto>>(queues);
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

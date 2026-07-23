using AutoMapper;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Application.Dtos.ResponseDtos;
using CallCenter.Domain.Entities;
using CallCenter.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CallCenter.Infrastructure.Services;

internal sealed class CallQueueService(CallCenterDbContext db, IMapper mapper) : ICallQueueService
{
    public async Task<CallQueueResponseDto> CreateAsync(
        CreateCallQueueRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var name = request.Name.Trim();
        if (await db.CallQueues.AnyAsync(queue => queue.Name == name, cancellationToken))
            throw new ArgumentException("A call queue with this name already exists.");

        var queue = new CallQueue
        {
            Name = name,
            Description = NormalizeOptional(request.Description)
        };

        db.CallQueues.Add(queue);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<CallQueueResponseDto>(queue);
    }

    public async Task<CallQueueResponseDto> UpdateAsync(
        Guid callQueueId,
        UpdateCallQueueRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var queue = await db.CallQueues.SingleOrDefaultAsync(x => x.Id == callQueueId, cancellationToken)
            ?? throw new KeyNotFoundException("Call queue was not found.");
        var name = request.Name.Trim();
        if (await db.CallQueues.AnyAsync(x => x.Id != callQueueId && x.Name == name, cancellationToken))
            throw new ArgumentException("A call queue with this name already exists.");

        queue.Name = name;
        queue.Description = NormalizeOptional(request.Description);
        queue.IsActive = request.IsActive;
        queue.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<CallQueueResponseDto>(queue);
    }

    public async Task<IReadOnlyCollection<CallQueueResponseDto>> GetActiveAsync(
        CancellationToken cancellationToken = default)
    {
        var queues = await db.CallQueues.AsNoTracking()
            .Where(queue => queue.IsActive)
            .OrderBy(queue => queue.Name)
            .ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyCollection<CallQueueResponseDto>>(queues);
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

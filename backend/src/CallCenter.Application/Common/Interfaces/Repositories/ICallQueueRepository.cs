using CallCenter.Domain.Entities;

namespace CallCenter.Application.Common.Interfaces.Repositories;

public interface ICallQueueRepository : IRepository<CallQueue>
{
    Task<IReadOnlyCollection<CallQueue>> GetActiveAsync(
        CancellationToken cancellationToken = default);

    Task<CallQueue?> GetByNameAsync(
        string name,
        CancellationToken cancellationToken = default);
}

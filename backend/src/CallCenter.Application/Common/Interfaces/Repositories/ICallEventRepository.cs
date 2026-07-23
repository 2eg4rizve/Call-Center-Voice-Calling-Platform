using CallCenter.Domain.Entities;

namespace CallCenter.Application.Common.Interfaces.Repositories;

public interface ICallEventRepository : IRepository<CallEvent>
{
    Task<IReadOnlyCollection<CallEvent>> GetByCallIdAsync(
        Guid callId,
        CancellationToken cancellationToken = default);
}

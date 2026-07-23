using CallCenter.Domain.Entities;
using CallCenter.Domain.Enums;

namespace CallCenter.Application.Common.Interfaces.Services;

public interface ICrmSimulationService
{
    Task<CrmSyncStatus> SynchronizeCallActivityAsync(
        Call call,
        CancellationToken cancellationToken = default);
}

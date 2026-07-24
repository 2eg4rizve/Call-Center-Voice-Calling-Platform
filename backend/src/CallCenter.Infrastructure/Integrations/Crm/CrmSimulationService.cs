using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Domain.Entities;
using CallCenter.Domain.Enums;

namespace CallCenter.Infrastructure.Integrations.Crm;

internal sealed class CrmSimulationService : ICrmSimulationService
{
    public Task<CrmSyncStatus> SynchronizeCallActivityAsync(
        Call call,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(CrmSyncStatus.Synced);
}

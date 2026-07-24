using CallCenter.Application.Common.Interfaces.Services;

namespace CallCenter.Infrastructure.Integrations.Telephony;

internal sealed class MockTelephonyProvider : ITelephonyProvider
{
    public Task<string> GenerateCallReferenceAsync(
        CancellationToken cancellationToken = default)
    {
        var reference = $"CALL-{DateTimeOffset.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..31]
            .ToUpperInvariant();
        return Task.FromResult(reference);
    }
}

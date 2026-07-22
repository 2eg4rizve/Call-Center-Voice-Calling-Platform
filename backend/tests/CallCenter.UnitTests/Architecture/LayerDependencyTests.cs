using CallCenter.Domain.Common;

namespace CallCenter.UnitTests.Architecture;

public sealed class LayerDependencyTests
{
    [Fact]
    public void DomainAssembly_DoesNotReferenceOuterLayers()
    {
        var references = typeof(BaseEntity).Assembly
            .GetReferencedAssemblies()
            .Select(assembly => assembly.Name)
            .ToArray();

        Assert.DoesNotContain("CallCenter.Application", references);
        Assert.DoesNotContain("CallCenter.Infrastructure", references);
        Assert.DoesNotContain("CallCenter.Api", references);
    }
}

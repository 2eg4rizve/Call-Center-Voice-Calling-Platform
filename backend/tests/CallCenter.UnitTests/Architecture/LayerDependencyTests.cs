using CallCenter.Domain.Common;
using CallCenter.Application.Common.Interfaces.Repositories;

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

    [Fact]
    public void ApplicationAssembly_DoesNotReferenceInfrastructureOrApi()
    {
        var references = typeof(IRepository<>).Assembly
            .GetReferencedAssemblies()
            .Select(assembly => assembly.Name)
            .ToArray();

        Assert.DoesNotContain("CallCenter.Infrastructure", references);
        Assert.DoesNotContain("CallCenter.Api", references);
    }

    [Fact]
    public void RepositoryContracts_DoNotExposeDatabaseQueryTypes()
    {
        var repositoryInterfaces = typeof(IRepository<>).Assembly
            .GetTypes()
            .Where(type =>
                type.IsInterface &&
                type.Namespace == "CallCenter.Application.Common.Interfaces.Repositories");

        var exposedQueryTypes = repositoryInterfaces
            .SelectMany(type => type.GetMethods())
            .SelectMany(method => method.GetParameters()
                .Select(parameter => parameter.ParameterType)
                .Append(method.ReturnType))
            .Where(ContainsDatabaseQueryType)
            .ToArray();

        Assert.Empty(exposedQueryTypes);
    }

    private static bool ContainsDatabaseQueryType(Type type)
    {
        if (type.IsGenericType)
        {
            var genericType = type.GetGenericTypeDefinition();
            if (genericType == typeof(IQueryable<>) ||
                genericType.FullName?.StartsWith(
                    "System.Linq.Expressions.Expression`",
                    StringComparison.Ordinal) == true)
            {
                return true;
            }

            return type.GetGenericArguments().Any(ContainsDatabaseQueryType);
        }

        return false;
    }
}

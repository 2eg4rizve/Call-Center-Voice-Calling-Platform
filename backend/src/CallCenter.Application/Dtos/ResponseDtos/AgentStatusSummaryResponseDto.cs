namespace CallCenter.Application.Dtos.ResponseDtos;

public sealed class AgentStatusSummaryResponseDto
{
    public IReadOnlyCollection<AgentSummaryResponseDto> Agents { get; init; } = [];
}

namespace CallCenter.Application.Dtos.RequestDtos;

public sealed class AssignAgentToCallQueueRequestDto
{
    public Guid AgentId { get; init; }

    public Guid CallQueueId { get; init; }
}

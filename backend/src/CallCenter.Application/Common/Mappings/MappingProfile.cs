using AutoMapper;
using CallCenter.Application.Dtos.ResponseDtos;
using CallCenter.Domain.Entities;
using CallCenter.Domain.Enums;

namespace CallCenter.Application.Common.Mappings;

public sealed class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Agent, AgentResponseDto>()
            .ForMember(destination => destination.CallQueueNames, options => options.MapFrom(source =>
                source.AgentQueues.Select(agentQueue => agentQueue.CallQueue.Name)));
        CreateMap<Agent, AgentSummaryResponseDto>()
            .ForMember(destination => destination.CurrentCallReference, options => options.MapFrom(source =>
                source.AssignedCalls
                    .Where(call => call.Status == CallStatus.Assigned || call.Status == CallStatus.Active)
                    .Select(call => call.CallReferenceNumber)
                    .FirstOrDefault()));
        CreateMap<Customer, CustomerResponseDto>()
            .ForMember(destination => destination.IsKnownCustomer, options => options.MapFrom(_ => true));
        CreateMap<CallQueue, CallQueueResponseDto>();
        CreateMap<Call, CallResponseDto>()
            .ForMember(destination => destination.CallQueueName, options => options.MapFrom(source =>
                source.CallQueue.Name))
            .ForMember(destination => destination.AssignedAgentName, options => options.MapFrom(source =>
                source.AssignedAgent == null ? null : source.AssignedAgent.DisplayName))
            .Include<Call, CallDetailsResponseDto>();
        CreateMap<Call, CallHistoryResponseDto>()
            .ForMember(destination => destination.CustomerName, options => options.MapFrom(source =>
                source.Customer == null ? null : source.Customer.Name))
            .ForMember(destination => destination.AgentName, options => options.MapFrom(source =>
                source.AssignedAgent == null ? null : source.AssignedAgent.DisplayName))
            .ForMember(destination => destination.CallQueueName, options => options.MapFrom(source =>
                source.CallQueue.Name));
        CreateMap<Call, CallDetailsResponseDto>()
            .IncludeBase<Call, CallResponseDto>()
            .ForMember(destination => destination.Events, options => options.MapFrom(source =>
                source.CallEvents));
        CreateMap<CallEvent, CallEventResponseDto>();
    }
}

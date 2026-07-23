using AutoMapper;
using CallCenter.Application.Agents.Dtos;
using CallCenter.Application.CallQueues.Dtos;
using CallCenter.Application.Calls.Dtos;
using CallCenter.Application.Customers.Dtos;
using CallCenter.Domain.Entities;

namespace CallCenter.Application.Common.Mappings;

public sealed class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Agent, AgentResponseDto>()
            .ForMember(destination => destination.CallQueueIds, options => options.MapFrom(source =>
                source.AgentQueues.Select(agentQueue => agentQueue.CallQueueId)));
        CreateMap<Agent, AgentSummaryResponseDto>();
        CreateMap<Customer, CustomerResponseDto>();
        CreateMap<CallQueue, CallQueueResponseDto>();
        CreateMap<Call, CallResponseDto>();
        CreateMap<Call, CallHistoryResponseDto>()
            .ForMember(destination => destination.CustomerName, options => options.MapFrom(source =>
                source.Customer == null ? null : source.Customer.Name))
            .ForMember(destination => destination.AgentDisplayName, options => options.MapFrom(source =>
                source.AssignedAgent == null ? null : source.AssignedAgent.DisplayName))
            .ForMember(destination => destination.CallQueueName, options => options.MapFrom(source =>
                source.CallQueue.Name));
        CreateMap<Call, CallDetailsResponseDto>()
            .ForMember(destination => destination.Events, options => options.MapFrom(source =>
                source.CallEvents));
        CreateMap<CallEvent, CallEventResponseDto>();
    }
}

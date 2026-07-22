using AutoMapper;
using CallCenter.Application.Agents.Dtos;
using CallCenter.Application.Calls.Dtos;
using CallCenter.Application.Customers.Dtos;
using CallCenter.Application.Queues.Dtos;
using CallCenter.Domain.Entities;

namespace CallCenter.Application.Common.Mappings;

public sealed class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Agent, AgentResponseDto>();
        CreateMap<Agent, AgentSummaryResponseDto>();
        CreateMap<Customer, CustomerResponseDto>();
        CreateMap<Queue, QueueResponseDto>();
        CreateMap<Call, CallResponseDto>()
            .ForMember(destination => destination.Duration, options => options.MapFrom(source =>
                source.AcceptedAt.HasValue && source.CompletedAt.HasValue
                    ? source.CompletedAt.Value - source.AcceptedAt.Value
                    : (TimeSpan?)null));
        CreateMap<Call, AssignedCallResponseDto>();
        CreateMap<Call, CallHistoryResponseDto>()
            .ForMember(destination => destination.Duration, options => options.MapFrom(source =>
                source.AcceptedAt.HasValue && source.CompletedAt.HasValue
                    ? source.CompletedAt.Value - source.AcceptedAt.Value
                    : (TimeSpan?)null));
        CreateMap<Call, CallDetailsResponseDto>()
            .ForMember(destination => destination.Duration, options => options.MapFrom(source =>
                source.AcceptedAt.HasValue && source.CompletedAt.HasValue
                    ? source.CompletedAt.Value - source.AcceptedAt.Value
                    : (TimeSpan?)null));
        CreateMap<CallEvent, CallEventResponseDto>();
    }
}

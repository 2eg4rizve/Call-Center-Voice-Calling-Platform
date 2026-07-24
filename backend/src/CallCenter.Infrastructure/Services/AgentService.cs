using AutoMapper;
using CallCenter.Application.Common.Interfaces.Services;
using CallCenter.Application.Dtos.RequestDtos;
using CallCenter.Application.Dtos.ResponseDtos;
using CallCenter.Domain.Entities;
using CallCenter.Domain.Enums;
using CallCenter.Infrastructure.Identity;
using CallCenter.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CallCenter.Infrastructure.Services;

internal sealed class AgentService(
    CallCenterDbContext db,
    UserManager<ApplicationUser> users,
    ICallAssignmentService callAssignmentService,
    IMapper mapper) : IAgentService
{
    public async Task<AgentResponseDto> CreateAsync(CreateAgentRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = new ApplicationUser { UserName = request.Email, Email = request.Email, FullName = request.FullName, EmailConfirmed = true };
        var result = await users.CreateAsync(user, request.Password);
        if (!result.Succeeded) throw new ArgumentException(string.Join("; ", result.Errors.Select(x => x.Description)));
        await users.AddToRoleAsync(user, "Agent");
        var agent = new Agent { IdentityUserId = user.Id, DisplayName = request.DisplayName, Status = AgentStatus.Offline };
        db.Agents.Add(agent);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<AgentResponseDto>(agent);
    }

    public async Task<AgentResponseDto> UpdateAsync(Guid agentId, UpdateAgentRequestDto request, CancellationToken cancellationToken = default)
    {
        var agent = await GetAgent(agentId, cancellationToken);
        agent.DisplayName = request.DisplayName;
        agent.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<AgentResponseDto>(agent);
    }

    public async Task<AgentResponseDto> GetCurrentAsync(string identityUserId, CancellationToken cancellationToken = default)
    {
        var agent = await db.Agents.AsNoTracking().Include(x => x.AgentQueues).ThenInclude(x => x.CallQueue).SingleOrDefaultAsync(x => x.IdentityUserId == identityUserId, cancellationToken)
            ?? throw new KeyNotFoundException("Agent profile was not found.");
        return mapper.Map<AgentResponseDto>(agent);
    }

    public async Task<IReadOnlyCollection<AgentSummaryResponseDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var agents = await db.Agents.AsNoTracking().Include(x => x.AssignedCalls).OrderBy(x => x.DisplayName).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyCollection<AgentSummaryResponseDto>>(agents);
    }

    public async Task<AgentResponseDto> UpdateStatusAsync(string identityUserId, UpdateAgentStatusRequestDto request, CancellationToken cancellationToken = default)
    {
        var agent = await db.Agents.Include(x => x.AgentQueues).ThenInclude(x => x.CallQueue).SingleOrDefaultAsync(x => x.IdentityUserId == identityUserId, cancellationToken)
            ?? throw new KeyNotFoundException("Agent profile was not found.");
        agent.Status = request.Status!.Value;
        if (agent.Status == AgentStatus.Available) agent.LastAvailableAtUtc = DateTimeOffset.UtcNow;
        agent.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        if (agent.Status == AgentStatus.Available)
            await callAssignmentService.TryAssignNextWaitingCallToAgentAsync(agent.Id, cancellationToken);

        return mapper.Map<AgentResponseDto>(agent);
    }

    public async Task AssignToCallQueueAsync(AssignAgentToCallQueueRequestDto request, CancellationToken cancellationToken = default)
    {
        if (!await db.Agents.AnyAsync(x => x.Id == request.AgentId, cancellationToken) || !await db.CallQueues.AnyAsync(x => x.Id == request.CallQueueId, cancellationToken)) throw new KeyNotFoundException("Agent or call queue was not found.");
        if (!await db.AgentQueues.AnyAsync(x => x.AgentId == request.AgentId && x.CallQueueId == request.CallQueueId, cancellationToken)) { db.AgentQueues.Add(new AgentQueue { AgentId = request.AgentId, CallQueueId = request.CallQueueId }); await db.SaveChangesAsync(cancellationToken); }
    }

    private async Task<Agent> GetAgent(Guid id, CancellationToken token) => await db.Agents.Include(x => x.AgentQueues).ThenInclude(x => x.CallQueue).SingleOrDefaultAsync(x => x.Id == id, token) ?? throw new KeyNotFoundException("Agent was not found.");
}

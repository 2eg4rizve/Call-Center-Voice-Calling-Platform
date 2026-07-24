import { AgentStatus } from './enums';

export interface AgentResponse { id: string; displayName: string; status: AgentStatus; lastAvailableAtUtc: string | null; callQueueNames: string[] }
export interface AgentSummaryResponse { id: string; displayName: string; status: AgentStatus; lastAvailableAtUtc: string | null; currentCallReference: string | null; callQueueNames: string[] }
export interface AgentStatusSummaryResponse { agents: AgentSummaryResponse[] }
export interface CreateAgentRequest { fullName: string; email: string; password: string; displayName: string }
export interface UpdateAgentRequest { displayName: string }
export interface UpdateAgentStatusRequest { status: AgentStatus }
export interface AssignAgentToCallQueueRequest { agentId: string; callQueueId: string }

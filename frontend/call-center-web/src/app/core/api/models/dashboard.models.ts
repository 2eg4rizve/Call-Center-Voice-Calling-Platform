import { AgentSummaryResponse } from './agent.models';
import { CallResponse } from './call.models';

export interface DashboardMetricsResponse { totalAgents: number; availableAgents: number; busyAgents: number; onBreakAgents: number; offlineAgents: number; waitingCalls: number; assignedCalls: number; activeCalls: number; completedCallsToday: number; averageCompletedCallDurationSeconds: number }
export interface AgentStatusSummaryResponse { agents: AgentSummaryResponse[] }
export interface OperationalCallsResponse { waitingCalls: CallResponse[]; activeCalls: CallResponse[] }

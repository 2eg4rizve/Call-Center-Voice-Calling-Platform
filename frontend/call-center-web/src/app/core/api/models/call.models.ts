import { CustomerResponse } from './customer.models';
import { CallDirection, CallEventType, CallOutcome, CallStatus, CrmSyncStatus } from './enums';

export interface CreateCallRequest { customerId: string | null; callerPhoneNumber: string | null; callQueueId: string }
export interface CompleteCallRequest { outcome: CallOutcome; notes: string | null }
export interface CallHistoryRequest { page?: number; pageSize?: number; agentId?: string | null; customerSearch?: string | null; status?: CallStatus | null; outcome?: CallOutcome | null; fromDateUtc?: string | null; toDateUtc?: string | null }
export interface CallResponse { id: string; callReferenceNumber: string; direction: CallDirection; status: CallStatus; customer: CustomerResponse | null; callQueueId: string; callQueueName: string; assignedAgentId: string | null; assignedAgentName: string | null; createdAtUtc: string; assignedAtUtc: string | null; acceptedAtUtc: string | null; completedAtUtc: string | null; outcome: CallOutcome | null; notes: string | null; crmSyncStatus: CrmSyncStatus; durationSeconds: number | null }
export interface CallEventResponse { id: string; eventType: CallEventType; eventAtUtc: string; details: string | null }
export interface CallDetailsResponse extends CallResponse { events: CallEventResponse[] }
export interface CallHistoryResponse { id: string; callReferenceNumber: string; direction: CallDirection; status: CallStatus; customerName: string | null; agentName: string | null; callQueueName: string; createdAtUtc: string; completedAtUtc: string | null; durationSeconds: number | null; outcome: CallOutcome | null; crmSyncStatus: CrmSyncStatus }
export interface PagedResponse<T> { items: T[]; totalCount: number; page: number; pageSize: number; totalPages: number }

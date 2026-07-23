export type AgentStatus = 'Available' | 'Busy' | 'OnBreak' | 'Offline';
export type CallStatus = 'Waiting' | 'Assigned' | 'Active' | 'Completed' | 'Missed' | 'Cancelled';
export type CallOutcome = 'Resolved' | 'FollowUpRequired' | 'Escalated' | 'NoAnswer' | 'WrongNumber';
export type CallDirection = 'Inbound' | 'Outbound';
export type CallEventType = 'Created' | 'Assigned' | 'Accepted' | 'Completed' | 'Missed' | 'Cancelled';
export type CrmSyncStatus = 'Pending' | 'Synced' | 'Failed';

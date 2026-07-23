export type StatusTone = 'positive' | 'info' | 'warning' | 'negative' | 'neutral';
export interface StatusPresentation { label: string; tone: StatusTone }

export const STATUS_PRESENTATIONS: Record<string, StatusPresentation> = {
  Available: { label: 'Available', tone: 'positive' }, Busy: { label: 'Busy', tone: 'warning' },
  OnBreak: { label: 'On break', tone: 'info' }, Offline: { label: 'Offline', tone: 'neutral' },
  Waiting: { label: 'Waiting', tone: 'warning' }, Assigned: { label: 'Assigned', tone: 'info' },
  Active: { label: 'Active', tone: 'positive' }, Completed: { label: 'Completed', tone: 'neutral' },
  Missed: { label: 'Missed', tone: 'negative' }, Cancelled: { label: 'Cancelled', tone: 'neutral' },
  Resolved: { label: 'Resolved', tone: 'positive' }, FollowUpRequired: { label: 'Follow-up required', tone: 'warning' },
  Escalated: { label: 'Escalated', tone: 'negative' }, NoAnswer: { label: 'No answer', tone: 'neutral' },
  WrongNumber: { label: 'Wrong number', tone: 'negative' }, Pending: { label: 'Pending', tone: 'warning' },
  Synced: { label: 'Synced', tone: 'positive' }, Failed: { label: 'Failed', tone: 'negative' },
};

export function statusPresentation(status: string): StatusPresentation {
  return STATUS_PRESENTATIONS[status] ?? { label: status || 'Unknown', tone: 'neutral' };
}

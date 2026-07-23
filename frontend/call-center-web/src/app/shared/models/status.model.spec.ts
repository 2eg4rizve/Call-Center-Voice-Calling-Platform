import { statusPresentation } from './status.model';

describe('statusPresentation', () => {
  it('maps operational statuses consistently', () => {
    expect(statusPresentation('Available')).toEqual({ label: 'Available', tone: 'positive' });
    expect(statusPresentation('Failed')).toEqual({ label: 'Failed', tone: 'negative' });
    expect(statusPresentation('FollowUpRequired').label).toBe('Follow-up required');
  });

  it('uses a safe neutral fallback', () => {
    expect(statusPresentation('FutureStatus')).toEqual({ label: 'FutureStatus', tone: 'neutral' });
  });
});

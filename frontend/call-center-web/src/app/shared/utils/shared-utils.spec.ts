import { FormControl, FormGroup } from '@angular/forms';
import { localDateToUtcIso } from './date-filter.util';
import { toHttpParams } from './query-params.util';
import { applyServerValidationErrors } from './server-validation.util';

describe('shared utilities', () => {
  it('converts local date bounds to UTC ISO values', () => {
    const start = localDateToUtcIso('2026-07-23');
    const end = localDateToUtcIso('2026-07-23', true);
    expect(start).toBe(new Date('2026-07-23T00:00:00').toISOString());
    expect(end).toBe(new Date('2026-07-23T23:59:59.999').toISOString());
  });

  it('serializes values while omitting empty filters', () => {
    const params = toHttpParams({ page: 2, active: false, search: '', outcome: null, role: 'Agent' });
    expect(params.toString()).toBe('page=2&active=false&role=Agent');
  });

  it('maps case-insensitive server errors to form controls', () => {
    const form = new FormGroup({ email: new FormControl('bad') });
    applyServerValidationErrors(form, { Email: ['Invalid email'] });
    expect(form.controls.email.errors?.['server']).toEqual(['Invalid email']);
    expect(form.controls.email.touched).toBe(true);
  });
});

import { FormControl, FormGroup } from '@angular/forms';
import { dateRangeValidator } from './date-range.validator';
import { phoneNumberValidator } from './phone-number.validator';

describe('shared validators', () => {
  it('validates international phone numbers', () => {
    expect(phoneNumberValidator(new FormControl('+880 1712-345678'))).toBeNull();
    expect(phoneNumberValidator(new FormControl('123'))).toEqual({ phoneNumber: true });
  });

  it('rejects an inverted date range', () => {
    const form = new FormGroup({ from: new FormControl('2026-07-24'), to: new FormControl('2026-07-23') }, { validators: dateRangeValidator() });
    expect(form.errors).toEqual({ dateRange: true });
  });
});

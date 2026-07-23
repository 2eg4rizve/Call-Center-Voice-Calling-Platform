import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dateRangeValidator(fromKey = 'from', toKey = 'to'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const from = control.get(fromKey)?.value as string | Date | null;
    const to = control.get(toKey)?.value as string | Date | null;
    if (!from || !to) return null;
    const fromTime = new Date(from).getTime();
    const toTime = new Date(to).getTime();
    return Number.isFinite(fromTime) && Number.isFinite(toTime) && fromTime <= toTime ? null : { dateRange: true };
  };
}

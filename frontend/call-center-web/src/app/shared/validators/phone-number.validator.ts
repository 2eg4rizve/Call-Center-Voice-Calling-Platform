import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const phoneNumberValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').replace(/[\s()-]/g, '');
  return !value || /^\+?[1-9]\d{7,14}$/.test(value) ? null : { phoneNumber: true };
};

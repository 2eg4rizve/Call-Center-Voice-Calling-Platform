import { FormGroup } from '@angular/forms';

export function applyServerValidationErrors(form: FormGroup, errors: Record<string, string[]>): void {
  for (const [serverKey, messages] of Object.entries(errors)) {
    const controlKey = Object.keys(form.controls).find((key) => key.toLowerCase() === serverKey.toLowerCase());
    const control = controlKey ? form.controls[controlKey] : null;
    if (control) {
      control.setErrors({ ...control.errors, server: messages });
      control.markAsTouched();
    } else {
      form.setErrors({ ...form.errors, server: [...((form.errors?.['server'] as string[] | undefined) ?? []), ...messages] });
    }
  }
}

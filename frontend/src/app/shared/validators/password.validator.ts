import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordPolicyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;

    const errors: ValidationErrors = {};
    if (value.length < 8) errors['minlength'] = true;
    if (!/[A-Z]/.test(value)) errors['uppercase'] = true;
    if (!/[a-z]/.test(value)) errors['lowercase'] = true;
    if (!/[0-9]/.test(value)) errors['number'] = true;
    if (!/[^A-Za-z0-9]/.test(value)) errors['special'] = true;

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

export function passwordsMatchValidator(passwordKey: string, confirmKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value;
    const confirm = group.get(confirmKey)?.value;
    if (!password || !confirm) return null;
    return password === confirm ? null : { passwordMismatch: true };
  };
}

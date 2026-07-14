import { HttpErrorResponse } from '@angular/common/http';

export function extractErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado. Intente nuevamente.'): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error;
    if (body?.errors?.length) {
      return body.errors.map((e: { message: string }) => e.message).join(' ');
    }
    if (body?.message) {
      return body.message;
    }
  }
  return fallback;
}

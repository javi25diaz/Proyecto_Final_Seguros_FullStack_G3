import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toast = inject(ToastService);

  const token = authService.getToken();
  const authorizedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authorizedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        toast.error('Su sesión ha expirado. Inicie sesión nuevamente.');
      } else if (error.status === 403) {
        toast.error(error.error?.message || 'Acceso denegado: no posee permisos para esta acción.');
      }
      return throwError(() => error);
    })
  );
};

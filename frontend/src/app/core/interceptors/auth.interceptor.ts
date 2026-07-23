import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

const GLOBAL_NOTICE_DURATION_MS = 4500;
const activeGlobalNotices = new Set<string>();

function notifyOnce(toast: ToastService, key: string, message: string): void {
  if (activeGlobalNotices.has(key)) {
    return;
  }
  activeGlobalNotices.add(key);
  toast.error(message);
  setTimeout(() => activeGlobalNotices.delete(key), GLOBAL_NOTICE_DURATION_MS);
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toast = inject(ToastService);
  const router = inject(Router);

  const token = authService.getToken();
  const authorizedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authorizedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isLoginRequest = req.url.includes('/auth/login');

      if (error.status === 401) {
        // Wrong-credential 401s from the login form itself are handled locally by
        // LoginComponent; treating them as a session expiry would log the user out
        // of a session that never existed and loop back to /login with a misleading toast.
        if (!isLoginRequest && authService.isAuthenticated()) {
          authService.logout();
          toast.error('Su sesión ha expirado. Inicie sesión nuevamente.');
        }
      } else if (error.status === 403) {
        if (!router.url.startsWith('/forbidden')) {
          toast.error(error.error?.message || 'Acceso denegado: no posee permisos para esta acción.');
          router.navigate(['/forbidden']);
        }
      } else if (error.status === 0) {
        notifyOnce(toast, 'network-error', 'No fue posible conectar con el servidor. Verifica tu conexión e intenta nuevamente.');
      } else if (error.status >= 500) {
        notifyOnce(toast, 'server-error', 'Ocurrió un error en el servidor. Intenta nuevamente.');
      }

      return throwError(() => error);
    })
  );
};

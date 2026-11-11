import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service.service';
import { ToastService } from '../services/toast.service';

/** Código que devuelve el backend (verifyToken) cuando el token falta, es inválido o ha caducado. */
const TOKEN_INVALIDO = 'TOKEN_INVALIDO';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const token = authService.getToken();

  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      // Sesión caducada: cerramos sesión una sola vez (pueden fallar varias peticiones a la vez)
      if (
        error instanceof HttpErrorResponse &&
        error.error?.code === TOKEN_INVALIDO &&
        authService.currentUser() !== null
      ) {
        authService.logout();
        toastService.showErrorToast('Tu sesión ha caducado. Vuelve a iniciar sesión.');
      }
      return throwError(() => error);
    }),
  );
};

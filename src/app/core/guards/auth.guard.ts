import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) return true;

  // Sesión caducada o inexistente: limpiamos restos y al login
  authService.clearSession();
  return router.createUrlTree(['/login']);
};

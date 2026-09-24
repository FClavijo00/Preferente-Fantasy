import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service.service';

export const authGuard: CanActivateFn = () => {
  const _authService = inject(AuthService);
  const router = inject(Router);

  if (_authService.isAuthenticated()) {
    return true; // Permite el acceso
  }

  // Si no hay usuario en la Signal, redirige al login
  return router.createUrlTree(['/login']);
};
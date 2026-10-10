import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service.service';

export const rootRedirectGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Comprobamos el token (igual que en tu pantalla de recepción)
  const isAuthenticated = await authService.isAuthenticated();

  if (isAuthenticated) {
    // Usuario con sesión activa -> A la app
    return router.createUrlTree(['/recepcion']);
  } else {
    // Sin sesión (o Bot de Google) -> A la Landing Page
    return router.createUrlTree(['/landing-page']);
  }
};
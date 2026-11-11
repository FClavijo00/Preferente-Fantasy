import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service.service';

/** Ruta raíz: con sesión a la app, sin sesión (o bots) a la landing. */
export const rootRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return router.createUrlTree([authService.isAuthenticated() ? '/recepcion' : '/landing-page']);
};

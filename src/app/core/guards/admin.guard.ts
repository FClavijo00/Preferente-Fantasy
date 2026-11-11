import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service.service';

const ROL_ADMIN = 1;

/**
 * Solo comodidad de interfaz: evita que un usuario normal vea el panel de control.
 * La seguridad real está en el backend (middleware requireAdmin).
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getUser()?.rol_id === ROL_ADMIN ? true : router.createUrlTree(['/recepcion']);
};

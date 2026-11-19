import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth-service.service';
import { LigasService } from '../services/ligas.service';

/**
 * Las pestañas necesitan una liga seleccionada. Si se llega sin ella (p. ej. al pulsar una notificación):
 * con una sola liga se entra en ella directamente; con varias (o ninguna), a recepción para elegir.
 */
export const ligaGuard: CanActivateFn = async () => {
  const ligasService = inject(LigasService);
  const router = inject(Router);

  if (ligasService.ligaSeleccionada()) return true;
  // Sin sesión decide authGuard (al login); aquí no llamamos a la API
  if (!inject(AuthService).isAuthenticated()) return true;

  try {
    const { data } = await firstValueFrom(ligasService.getMisLigas());
    if (data.length === 1) {
      ligasService.setLigaSeleccionada(data[0]);
      return true;
    }
  } catch {
    /* sin conexión o error: que elija en recepción */
  }
  return router.createUrlTree(['/recepcion']);
};

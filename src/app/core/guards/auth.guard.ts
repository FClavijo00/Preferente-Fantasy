import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service.service';
import { NavController } from '@ionic/angular';

export const authGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);
  const navCtrl = inject(NavController);

  if (authService.isAuthenticated()) {
    return true; // Permite el acceso
  } else {
    navCtrl.navigateRoot('/landing-page', { replaceUrl: true });
  }

  // Si intenta entrar a una ruta protegida sin token, al login
  router.navigate(['/login']);
  return false;
};
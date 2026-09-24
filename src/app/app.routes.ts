import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // 1. Redirección inicial: al entrar a la raíz, intenta ir a /recepcion
  {
    path: '',
    redirectTo: 'recepcion',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'recepcion',
    loadComponent: () => import('./pages/recepcion/recepcion.page').then((m) => m.RecepcionPage),
    canActivate: [authGuard],
  },
  {
    path: 'panel-control',
    loadComponent: () => import('./pages/panel-control/panel-control.page').then((m) => m.PanelControlPage),
    canActivate: [authGuard],
  },
  {
    path: 'tabs',
    loadChildren: () => import('./pages/tabs/tabs.routes').then((m) => m.routes),
    canActivate: [authGuard],
  },
  // 2. Ruta comodín para URLs no encontradas
  {
    path: '**',
    redirectTo: 'recepcion',
  },
];
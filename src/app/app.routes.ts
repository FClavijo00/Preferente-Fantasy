import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'recepcion',
    loadComponent: () => import('./pages/recepcion/recepcion.page').then( m => m.RecepcionPage)
  },
  /* {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'plantillas',
    loadComponent: () => import('./pages/plantillas/plantillas.page').then( m => m.PlantillasPage)
  }, */
];

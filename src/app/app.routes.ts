import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { rootRedirectGuard } from './core/guards/root-redirect.guard';

export const routes: Routes = [

  // 1. RUTA RAÍZ: Decide a dónde va según si tiene sesión o no
  {
    path: '',
    canActivate: [rootRedirectGuard],
    children: [] // No carga ningún componente directamente, solo redirige
  },
  
  // 1. RUTAS PÚBLICAS (Acceso para Google y nuevos visitantes)
  {
    path: 'landing-page',
    loadComponent: () => import('./pages/landing-page/landing-page.page').then( m => m.LandingPagePage),
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
    path: 'politica-privacidad',
    loadComponent: () => import('./pages/politica-privacidad/politica-privacidad.page').then( m => m.PoliticaPrivacidadPage)
  },
  {
    path: 'terminos-servicio',
    loadComponent: () => import('./pages/terminos-servicio/terminos-servicio.page').then( m => m.TerminosServicioPage)
  },


  // 2. RUTAS PROTEGIDAS (Acceso para usuarios autenticados)
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

  // 3. Redirección por defecto: Si no hay ruta, va a la landing
  { path: '**', redirectTo: ''}
];
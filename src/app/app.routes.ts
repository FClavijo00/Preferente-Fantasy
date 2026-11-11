import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { rootRedirectGuard } from './core/guards/root-redirect.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';

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
    title: 'Fantasy del fútbol provincial de Jaén',
    data: {
      description:
        'Preferente Fantasy es el fantasy gratuito de la 1ª Andaluza de Jaén: ficha jugadores reales, ' +
        'alinea tu 11 ideal cada jornada y suma puntos según las actas oficiales.',
    },
    loadComponent: () => import('./pages/landing-page/landing-page.page').then( m => m.LandingPagePage),
  },
  {
    path: 'login',
    title: 'Iniciar sesión',
    data: { description: 'Accede a tu cuenta de Preferente Fantasy y gestiona tu plantilla y tu 11 ideal.' },
    loadComponent: () => import('./pages/auth/login/login.page').then((m) => m.LoginPage),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    title: 'Crear cuenta',
    data: { description: 'Regístrate gratis en Preferente Fantasy y empieza a competir en el fantasy de la 1ª Andaluza de Jaén.' },
    loadComponent: () => import('./pages/auth/register/register.page').then((m) => m.RegisterPage),
    canActivate: [guestGuard],
  },
  {
    path: 'politica-privacidad',
    title: 'Política de privacidad',
    data: { description: 'Cómo trata Preferente Fantasy tus datos personales conforme al RGPD y la LOPDGDD.' },
    loadComponent: () => import('./pages/politica-privacidad/politica-privacidad.page').then( m => m.PoliticaPrivacidadPage)
  },
  {
    path: 'aviso-legal',
    title: 'Aviso legal',
    data: { description: 'Datos identificativos del titular de Preferente Fantasy y condiciones legales del sitio web.' },
    loadComponent: () => import('./pages/aviso-legal/aviso-legal.page').then((m) => m.AvisoLegalPage),
  },
  {
    path: 'terminos-servicio',
    title: 'Términos de servicio',
    data: { description: 'Condiciones de uso de la plataforma Preferente Fantasy.' },
    loadComponent: () => import('./pages/terminos-servicio/terminos-servicio.page').then( m => m.TerminosServicioPage)
  },


  // 2. RUTAS PROTEGIDAS (Acceso para usuarios autenticados)
  {
    path: 'recepcion',
    data: { noindex: true },
    loadComponent: () => import('./pages/recepcion/recepcion.page').then((m) => m.RecepcionPage),
    canActivate: [authGuard],
  },
  {
    path: 'panel-control',
    data: { noindex: true },
    loadComponent: () => import('./pages/panel-control/panel-control.page').then((m) => m.PanelControlPage),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'tabs',
    data: { noindex: true },
    loadChildren: () => import('./pages/tabs/tabs.routes').then((m) => m.routes),
    canActivate: [authGuard],
  },

  // 3. Redirección por defecto: Si no hay ruta, va a la landing
  { path: '**', redirectTo: ''}
];
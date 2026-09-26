import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'plantillas',
        loadComponent: () =>
          import('../plantillas/plantillas.page').then((m) => m.PlantillasPage),
      },
      {
        path: 'alineacion',
        loadComponent: () =>
          import('../alineacion/alineacion.page').then((m) => m.AlineacionPage),
      },
      {
        path: 'clasificaciones',
        loadComponent: () =>
          import('../clasificaciones/clasificaciones.page').then((m) => m.ClasificacionesPage),
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  }
];

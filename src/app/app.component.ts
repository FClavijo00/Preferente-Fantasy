import { Component, inject } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, Router } from '@angular/router';
import { IonApp } from '@ionic/angular/ion-app';
import { IonRouterOutlet } from '@ionic/angular/ion-router-outlet';
import { filter, take } from 'rxjs';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet, LoadingComponent],
})
export class AppComponent {
  readonly entorno = environment.entorno;

  constructor() {
    // Quita la pantalla de carga de index.html cuando la primera página ya está pintada
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError),
        take(1),
      )
      .subscribe(() => this.quitarSplash());
  }

  private quitarSplash() {
    const splash = document.getElementById('pf-splash');
    if (!splash) return;
    // Un par de frames para que Ionic pinte la página antes de desvanecer
    requestAnimationFrame(() =>
      setTimeout(() => {
        splash.classList.add('oculto');
        setTimeout(() => splash.remove(), 400);
      }, 120),
    );
  }
}

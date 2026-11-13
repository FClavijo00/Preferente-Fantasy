import { Component, inject, Input } from '@angular/core';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonIcon } from '@ionic/angular/ion-icon';
import { NavController } from '@ionic/angular/nav-controller';
import { addIcons } from 'ionicons';
import { swapHorizontalOutline } from 'ionicons/icons';
import { LigasService } from '../../../core/services/ligas.service';

/** Nombre visible de cada sección (lo que pasan las páginas en "titulo"). */
const NOMBRE_SECCION: Record<string, string> = {
  Home: 'Inicio',
};

/**
 * Cabecera común de las pantallas de una liga.
 * - Izquierda: "Mis ligas" (sale de la liga y vuelve a recepción).
 * - Centro: la sección (pequeña) y el nombre de la liga (grande): la pestaña ya dice dónde estás,
 *   lo que no se ve en ningún otro sitio es en qué liga.
 * - Derecha: acciones propias de cada pantalla, con
 *   <app-header titulo="..."><button acciones class="pf-header-accion">…</button></app-header>
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [IonHeader, IonToolbar, IonIcon],
})
export class HeaderComponent {
  @Input() titulo = '';

  private _navCtrl = inject(NavController);
  private _ligasService = inject(LigasService);

  /** Signal: si cambia la liga seleccionada, la cabecera se actualiza sola. */
  readonly liga = this._ligasService.ligaSeleccionada;

  get seccion(): string {
    return NOMBRE_SECCION[this.titulo] ?? this.titulo;
  }

  constructor() {
    addIcons({ swapHorizontalOutline });
  }

  backRecepcion() {
    this._ligasService.clearLigaSeleccionada();
    this._navCtrl.navigateBack(['recepcion']);
  }
}

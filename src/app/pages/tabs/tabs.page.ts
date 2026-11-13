import { Component, computed, effect, EnvironmentInjector, inject, signal, untracked } from '@angular/core';
import { IonTabs } from '@ionic/angular/ion-tabs';
import { IonTabBar } from '@ionic/angular/ion-tab-bar';
import { IonTabButton } from '@ionic/angular/ion-tab-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonLabel } from '@ionic/angular/ion-label';
import { addIcons } from 'ionicons';
import { home, homeOutline, personCircle, personCircleOutline, podium, podiumOutline, shirt, shirtOutline } from 'ionicons/icons';
import { EstadoAlineacionService } from '../../core/services/estado-alineacion.service';
import { LigasService } from '../../core/services/ligas.service';

interface Pestana {
  tab: string;
  titulo: string;
  icono: string;
  iconoActivo: string;
  /** Botón central destacado (la acción principal de cada jornada) */
  central?: boolean;
}

/**
 * Orden: Inicio · Clasificación · [Alineación] · Plantillas · Perfil.
 * Alineación va en el centro y destacada: es lo que el usuario tiene que hacer cada jornada.
 */
const PESTANAS: Pestana[] = [
  { tab: 'home', titulo: 'Inicio', icono: 'home-outline', iconoActivo: 'home' },
  { tab: 'clasificaciones', titulo: 'Clasificación', icono: 'podium-outline', iconoActivo: 'podium' },
  { tab: 'alineacion', titulo: 'Alineación', icono: 'alineacion', iconoActivo: 'alineacion', central: true },
  { tab: 'plantillas', titulo: 'Plantillas', icono: 'shirt-outline', iconoActivo: 'shirt' },
  { tab: 'perfil', titulo: 'Perfil', icono: 'person-circle-outline', iconoActivo: 'person-circle' },
];

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);

  private _ligasService = inject(LigasService);
  private _estadoAlineacion = inject(EstadoAlineacionService);

  readonly pestanas = PESTANAS;
  readonly pestanaActual = signal('home');

  /**
   * Aviso de la alineación de la liga en la que se está: punto naranja si está sin hacer
   * (o incompleta) y rojo si cierra en menos de un día. Nada si ya está hecha.
   */
  readonly avisoAlineacion = computed(() => {
    const aviso = this._estadoAlineacion.aviso(this._ligasService.ligaSeleccionada()?.id);
    return aviso && aviso.nivel !== 'hecha' ? aviso : null;
  });

  constructor() {
    addIcons({
      home,
      homeOutline,
      podium,
      podiumOutline,
      shirt,
      shirtOutline,
      personCircle,
      personCircleOutline,
      // Icono propio (vectorial, se colorea con el texto): campo de fútbol
      alineacion: 'assets/icons/alineacion.svg',
    });

    // Al entrar en una liga (o cambiar de liga), se recarga el estado de la alineación.
    // untracked(): el effect solo debe depender de la liga, no de lo que lea la carga
    effect(() => {
      if (this._ligasService.ligaSeleccionada()) untracked(() => this._estadoAlineacion.cargar());
    });
  }

  /** Nombre accesible: en Alineación incluye el aviso ("Alineación: Cierra en 5 h"). */
  etiqueta(p: { tab: string; titulo: string; central?: boolean }): string {
    const aviso = p.central ? this.avisoAlineacion() : null;
    return aviso ? `${p.titulo}: ${aviso.texto}` : p.titulo;
  }

  setCurrentTab(event: { tab: string }) {
    this.pestanaActual.set(event.tab);
  }
}

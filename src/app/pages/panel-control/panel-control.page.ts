import { Component, inject, signal } from '@angular/core';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonSegment } from '@ionic/angular/ion-segment';
import { IonSegmentButton } from '@ionic/angular/ion-segment-button';
import { NavController } from '@ionic/angular/nav-controller';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  calendarNumberOutline,
  calendarOutline,
  personCircleOutline,
  starOutline,
  warningOutline,
} from 'ionicons/icons';
import { JornadasAdminComponent } from './secciones/jornadas-admin/jornadas-admin.component';
import { CalendarioAdminComponent } from './secciones/calendario-admin/calendario-admin.component';
import { JugadoresAdminComponent } from './secciones/jugadores-admin/jugadores-admin.component';
import { OnceIdealAdminComponent } from './secciones/once-ideal-admin/once-ideal-admin.component';
import { SancionesAdminComponent } from './secciones/sanciones-admin/sanciones-admin.component';

type Seccion =
  | 'jornadas'
  | 'calendario'
  | 'sanciones'
  | 'jugadores'
  | 'onceideal'
;

const SECCIONES: { id: Seccion; titulo: string; icono: string }[] = [
  { id: 'jornadas', titulo: 'Jornadas', icono: 'calendar-number-outline' },
  { id: 'calendario', titulo: 'Calendario', icono: 'calendar-outline' },
  { id: 'sanciones', titulo: 'Sanciones', icono: 'warning-outline' },
  { id: 'jugadores', titulo: 'Jugadores', icono: 'person-circle-outline' },
  { id: 'onceideal', titulo: '11 Ideal', icono: 'star-outline' },
];

/**
 * Panel de control (solo admin). Cada sección es un componente que carga sus propios datos:
 * aquí solo se elige cuál se muestra.
 */
@Component({
  selector: 'app-panel-control',
  templateUrl: './panel-control.page.html',
  styleUrls: ['./panel-control.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    JornadasAdminComponent,
    CalendarioAdminComponent,
    JugadoresAdminComponent,
    OnceIdealAdminComponent,
    SancionesAdminComponent,
  ],
})
export class PanelControlPage {
  private _navCtrl = inject(NavController);

  readonly secciones = SECCIONES;
  readonly content = signal<Seccion>('jornadas');

  constructor() {
    addIcons({
      arrowBackOutline,
      calendarNumberOutline,
      calendarOutline,
      personCircleOutline,
      starOutline,
      warningOutline,
    });
  }

  abrirSeccion(valor: unknown) {
    const seccion = SECCIONES.find((s) => s.id === valor)?.id;
    if (seccion) this.content.set(seccion);
  }

  volverRecepcion() {
    this._navCtrl.navigateRoot('/recepcion', { replaceUrl: true });
  }
}

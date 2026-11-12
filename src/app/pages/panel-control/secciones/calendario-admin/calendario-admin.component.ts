import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSelect } from '@ionic/angular/ion-select';
import { IonSelectOption } from '@ionic/angular/ion-select-option';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { ModalController } from '@ionic/angular/modal-controller';
import { AlertController } from '@ionic/angular/alert-controller';
import { addIcons } from 'ionicons';
import {
  addOutline,
  checkmarkCircle,
  createOutline,
  documentTextOutline,
  flagOutline,
  footballOutline,
  refreshOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import { EstadoJornada, JornadaAdmin, JornadasService } from '../../../../core/services/jornadas-service';
import { formatearFechaJornada } from '../../../../core/utils/fechas-jornada';
import { PartidosService } from '../../../../core/services/partidos.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { ToastService } from '../../../../core/services/toast.service';
import { opcionesModalAuto } from '../../../../core/utils/modal-auto';
import { CrearEditarPartidoComponent } from '../../../../shared/modals/crear-editar-partido/crear-editar-partido.component';
import { CrearEditarActaPartidoComponent } from '../../../../shared/modals/crear-editar-acta-partido/crear-editar-acta-partido.component';

/** Partido tal como lo devuelve cargarPartidosJornada. */
export interface PartidoJornada {
  partido_id: number;
  jornada_id: number;
  equipo_local_id: number;
  equipo_visitante_id: number;
  local_nombre: string;
  visitante_nombre: string;
  local_escudo?: string;
  visitante_escudo?: string;
  fecha_partido: string | null;
  /** "YYYY-MM-DDTHH:mm" en hora de España, tal cual está guardada (para editar) */
  fecha_partido_local: string | null;
  /** "DD/MM/YYYY" (hora de España) */
  fecha: string | null;
  /** "HH:MM" */
  hora: string | null;
  goles_local: number | null;
  goles_visitante: number | null;
  jugado: boolean;
  tiene_acta: boolean;
}

const TEXTO_ESTADO: Record<EstadoJornada, string> = {
  PENDIENTE: 'Pendiente',
  EN_JUEGO: 'En juego',
  CERRADA: 'Cerrada',
};

/** Opciones visuales del modal del acta (es de pantalla completa). */
const OPCIONES_MODAL_COMPLETO = {
  initialBreakpoint: 1,
  breakpoints: [0, 1],
  handle: false,
  mode: 'md' as const,
};

@Component({
  selector: 'app-calendario-admin',
  templateUrl: './calendario-admin.component.html',
  styleUrls: ['./calendario-admin.component.scss'],
  imports: [IonButton, IonIcon, IonSelect, IonSelectOption, IonSkeletonText],
})
export class CalendarioAdminComponent implements OnInit {
  private _jornadasService = inject(JornadasService);
  private _modalCtrl = inject(ModalController);
  private _alertCtrl = inject(AlertController);
  private _partidosService = inject(PartidosService);
  private _loadingService = inject(LoadingService);
  private _toastService = inject(ToastService);

  readonly jornadas = signal<JornadaAdmin[]>([]);
  readonly jornadaId = signal<number | null>(null);
  readonly partidos = signal<PartidoJornada[]>([]);

  readonly estadoJornadas = signal<'cargando' | 'listo' | 'error'>('cargando');
  readonly estadoPartidos = signal<'cargando' | 'listo' | 'error'>('cargando');

  readonly jornada = computed(() => this.jornadas().find((j) => j.id === this.jornadaId()) ?? null);
  readonly actasHechas = computed(() => this.partidos().filter((p) => p.tiene_acta).length);

  readonly textoEstado = TEXTO_ESTADO;
  readonly formatearFecha = formatearFechaJornada;

  /**
   * El desplegable usa el alert de la app con dos líneas por opción (ver alerts.scss).
   * OJO: aquí cssClass tiene que ser un texto, no un array: ion-select lo mete dentro de su
   * propio array de clases y un array anidado rompe el alert ("trim is not a function").
   */
  readonly opcionesSelector = {
    mode: 'ios',
    cssClass: 'pf-alert pf-alert-estado',
    header: 'Elegir jornada',
  };

  constructor() {
    addIcons({
      addOutline,
      checkmarkCircle,
      createOutline,
      documentTextOutline,
      flagOutline,
      footballOutline,
      refreshOutline,
      timeOutline,
      trashOutline,
    });
  }

  ngOnInit() {
    this.cargarJornadas();
  }

  /** "Jornada 9\nPendiente · sáb, 25 oct · 00:00": la segunda línea sale en gris en el alert. */
  etiquetaJornada(j: JornadaAdmin): string {
    return `Jornada ${j.numero_jornada} (${TEXTO_ESTADO[j.estado]}) · ${formatearFechaJornada(j.fecha_inicio)}`;
  }

  async cargarJornadas() {
    if (this.jornadas().length === 0) this.estadoJornadas.set('cargando');
    try {
      const res = await firstValueFrom(this._jornadasService.getJornadasAdmin());
      this.jornadas.set(res.data);
      this.estadoJornadas.set('listo');

      // Primera vez: se abre la jornada que toca (en juego, si no la siguiente pendiente, si no la última)
      if (this.jornadaId() === null && res.data.length > 0) {
        const porDefecto =
          res.data.find((j) => j.estado === 'EN_JUEGO') ??
          res.data.find((j) => j.estado === 'PENDIENTE') ??
          res.data[res.data.length - 1];
        this.seleccionarJornada(porDefecto.id);
      }
    } catch {
      this.estadoJornadas.set('error');
    }
  }

  seleccionarJornada(valor: unknown) {
    const id = Number(valor);
    if (!Number.isInteger(id)) return;
    this.jornadaId.set(id);
    this.cargarPartidos();
  }

  async cargarPartidos() {
    const id = this.jornadaId();
    if (id === null) return;

    this.estadoPartidos.set('cargando');
    try {
      const res = (await firstValueFrom(this._jornadasService.cargarPartidosJornada(id))) as {
        data: PartidoJornada[];
      };
      // Si mientras tanto se eligió otra jornada, esta respuesta ya no vale
      if (this.jornadaId() !== id) return;
      this.partidos.set(res.data ?? []);
      this.estadoPartidos.set('listo');
    } catch (error) {
      if (this.jornadaId() !== id) return;
      // El backend responde 404 cuando la jornada aún no tiene partidos
      if ((error as HttpErrorResponse).status === 404) {
        this.partidos.set([]);
        this.estadoPartidos.set('listo');
      } else {
        this.estadoPartidos.set('error');
      }
    }
  }

  /** "sáb, 25 oct · 17:00" a partir de "25/10/2026" y "17:00". */
  fechaPartido(p: PartidoJornada): string | null {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(p.fecha ?? '');
    if (!m) return null;
    return formatearFechaJornada(`${m[3]}-${m[2]}-${m[1]}T${p.hora ?? '00:00'}`);
  }

  tieneResultado(p: PartidoJornada): boolean {
    return p.jugado && p.goles_local !== null && p.goles_visitante !== null;
  }

  async nuevoPartido() {
    await this.abrirModalPartido('crear', {});
  }

  async editarPartido(p: PartidoJornada) {
    await this.abrirModalPartido('editar', p);
  }

  async eliminarPartido(p: PartidoJornada) {
    const alert = await this._alertCtrl.create({
      mode: 'ios',
      cssClass: ['pf-alert', 'pf-alert-peligro'],
      header: '¿Eliminar el partido?',
      subHeader: `${p.local_nombre} - ${p.visitante_nombre}`,
      message: p.tiene_acta
        ? 'Tiene acta: también se borrarán el acta y los puntos que dio a los jugadores. No se puede deshacer.'
        : 'Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'destructive') return;

    this._loadingService.show('Eliminando partido...');
    try {
      const resp = await firstValueFrom(this._partidosService.eliminarPartido(p.partido_id, p.tiene_acta));
      this._toastService.showSuccessToast(resp.message || 'Partido eliminado');
      this.refrescar();
    } catch (error) {
      const err = error as HttpErrorResponse;
      this._toastService.showErrorToast(err.error?.message || 'No se ha podido eliminar el partido');
    } finally {
      this._loadingService.hide();
    }
  }

  async abrirActa(p: PartidoJornada) {
    const modal = await this._modalCtrl.create({
      component: CrearEditarActaPartidoComponent,
      componentProps: { partido: p },
      ...OPCIONES_MODAL_COMPLETO,
    });
    await modal.present();

    const { role } = await modal.onWillDismiss();
    if (role === 'confirm') this.refrescar();
  }

  private async abrirModalPartido(modo: 'crear' | 'editar', partido: Partial<PartidoJornada>) {
    const modal = await this._modalCtrl.create({
      component: CrearEditarPartidoComponent,
      componentProps: { modo, jornada: this.jornada(), partido },
      // Se ajusta al contenido: sheet en el móvil, tarjeta centrada en el escritorio
      ...opcionesModalAuto(),
    });
    await modal.present();

    const { role } = await modal.onWillDismiss();
    if (role === 'confirm') this.refrescar();
  }

  /** Tras crear/editar un partido o un acta: partidos de la jornada y contadores del selector. */
  private refrescar() {
    this.cargarPartidos();
    this.cargarJornadas();
  }
}

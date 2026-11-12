import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { AlertController } from '@ionic/angular/alert-controller';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import {
  addOutline,
  calendarNumberOutline,
  chevronDown,
  createOutline,
  flagOutline,
  footballOutline,
  peopleOutline,
  refreshOutline,
  starOutline,
  trashOutline,
} from 'ionicons/icons';
import { EstadoJornada, JornadaAdmin, JornadasService } from '../../../../core/services/jornadas-service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { formatearFechaJornada, sumarDias } from '../../../../core/utils/fechas-jornada';
import { opcionesModalAuto } from '../../../../core/utils/modal-auto';
import {
  EditarJornadaComponent,
  JornadaFormulario,
} from '../../../../shared/modals/editar-jornada/editar-jornada.component';

const TEXTO_ESTADO: Record<EstadoJornada, string> = {
  PENDIENTE: 'Pendiente',
  EN_JUEGO: 'En Juego',
  CERRADA: 'Cerrada',
};

/** Qué implica cada estado para los usuarios (se muestra bajo cada opción del alert). */
const AYUDA_ESTADO: Record<EstadoJornada, string> = {
  PENDIENTE: 'Los usuarios pueden hacer su alineación',
  EN_JUEGO: 'Las alineaciones quedan bloqueadas',
  CERRADA: 'Jornada terminada',
};

@Component({
  selector: 'app-jornadas-admin',
  templateUrl: './jornadas-admin.component.html',
  styleUrls: ['./jornadas-admin.component.scss'],
  imports: [IonButton, IonIcon, IonSkeletonText],
})
export class JornadasAdminComponent implements OnInit {
  private _jornadasService = inject(JornadasService);
  private _modalCtrl = inject(ModalController);
  private _alertCtrl = inject(AlertController);
  private _toastService = inject(ToastService);
  private _loadingService = inject(LoadingService);

  readonly jornadas = signal<JornadaAdmin[]>([]);
  readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');

  /** La que verán los usuarios como "siguiente": la pendiente con menor número. */
  readonly idSiguiente = computed(() => this.jornadas().find((j) => j.estado === 'PENDIENTE')?.id ?? null);

  readonly textoEstado = TEXTO_ESTADO;
  readonly formatearFecha = formatearFechaJornada;

  constructor() {
    addIcons({
      addOutline,
      calendarNumberOutline,
      chevronDown,
      createOutline,
      flagOutline,
      footballOutline,
      peopleOutline,
      refreshOutline,
      starOutline,
      trashOutline,
    });
  }

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    if (this.jornadas().length === 0) this.estado.set('cargando');
    try {
      const res = await firstValueFrom(this._jornadasService.getJornadasAdmin());
      this.jornadas.set(res.data);
      this.estado.set('listo');
    } catch {
      this.estado.set('error');
    }
  }

  /** Solo se pueden borrar jornadas vacías (lo comprueba también el backend). */
  esEliminable(j: JornadaAdmin): boolean {
    return j.num_partidos === 0 && j.num_alineaciones === 0 && !j.tiene_once_ideal;
  }

  /** Propone la siguiente: número + 1 y las fechas de la última una semana después. */
  nuevaJornada() {
    const ultima = this.jornadas().at(-1);
    this.abrirFormulario(
      ultima
        ? {
            numero_jornada: ultima.numero_jornada + 1,
            fecha_inicio: sumarDias(ultima.fecha_inicio, 7),
            fecha_fin: sumarDias(ultima.fecha_fin, 7),
          }
        : { numero_jornada: 1 },
    );
  }

  editarJornada(j: JornadaAdmin) {
    this.abrirFormulario({
      id: j.id,
      numero_jornada: j.numero_jornada,
      fecha_inicio: j.fecha_inicio,
      fecha_fin: j.fecha_fin,
    });
  }

  private async abrirFormulario(jornada: JornadaFormulario) {
    const modal = await this._modalCtrl.create({
      component: EditarJornadaComponent,
      componentProps: { jornada },
      ...opcionesModalAuto(),
    });
    await modal.present();

    const { role } = await modal.onWillDismiss();
    if (role === 'confirm') this.cargar();
  }

  /**
   * El estado decide qué pueden hacer los usuarios:
   * PENDIENTE → pueden alinear · EN_JUEGO → alineaciones bloqueadas · CERRADA → terminada.
   */
  async cambiarEstado(j: JornadaAdmin) {
    const alert = await this._alertCtrl.create({
      mode: 'ios',
      cssClass: ['pf-alert', 'pf-alert-estado'], // estilos en src/theme/alerts.scss
      header: `Jornada ${j.numero_jornada}`,
      subHeader: 'Cambiar estado',
      inputs: (Object.keys(TEXTO_ESTADO) as EstadoJornada[]).map((estado) => ({
        type: 'radio' as const,
        // Dos líneas: el CSS pinta la primera como título y la segunda como descripción
        label: `${TEXTO_ESTADO[estado]}\n${AYUDA_ESTADO[estado]}`,
        value: estado,
        checked: estado === j.estado,
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar', role: 'confirm' },
      ],
    });
    await alert.present();

    const { role, data } = await alert.onDidDismiss<{ values: EstadoJornada }>();
    const nuevo = data?.values;
    if (role !== 'confirm' || !nuevo || nuevo === j.estado) return;

    this._loadingService.show('Cambiando estado...');
    try {
      const resp = await firstValueFrom(this._jornadasService.cambiarEstadoJornada({ jornadaId: j.id, estado: nuevo }));
      this._toastService.showSuccessToast(resp.message || 'Estado actualizado');
      this.jornadas.update((lista) => lista.map((x) => (x.id === j.id ? { ...x, estado: nuevo } : x)));
    } catch (error) {
      const err = error as HttpErrorResponse;
      this._toastService.showErrorToast(err.error?.message || 'No se ha podido cambiar el estado');
    } finally {
      this._loadingService.hide();
    }
  }

  async eliminarJornada(j: JornadaAdmin) {
    if (!this.esEliminable(j)) {
      this._toastService.showErrorToast(
        `La jornada ${j.numero_jornada} tiene partidos, alineaciones u 11 ideal: no se puede eliminar.`,
      );
      return;
    }

    const alert = await this._alertCtrl.create({
      mode: 'ios',
      cssClass: ['pf-alert', 'pf-alert-peligro'],
      header: `¿Eliminar la jornada ${j.numero_jornada}?`,
      message: 'Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'destructive') return;

    this._loadingService.show('Eliminando jornada...');
    try {
      const resp = await firstValueFrom(this._jornadasService.eliminarJornada(j.id));
      this._toastService.showSuccessToast(resp.message || 'Jornada eliminada');
      this.jornadas.update((lista) => lista.filter((x) => x.id !== j.id));
    } catch (error) {
      const err = error as HttpErrorResponse;
      this._toastService.showErrorToast(err.error?.message || 'No se ha podido eliminar la jornada');
    } finally {
      this._loadingService.hide();
    }
  }
}

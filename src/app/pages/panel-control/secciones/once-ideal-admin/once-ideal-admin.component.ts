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
  checkmarkCircle,
  createOutline,
  eyeOutline,
  refreshOutline,
  starOutline,
  trashOutline,
  warningOutline,
} from 'ionicons/icons';
import { JornadaOnceIdeal, JornadasService } from '../../../../core/services/jornadas-service';
import { AlineacionesService } from '../../../../core/services/alineaciones.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { ToastService } from '../../../../core/services/toast.service';
import { OnceIdealComponent } from '../../../../shared/modals/once-ideal/once-ideal.component';

/** El modal del 11 ideal es a pantalla completa (campo de fútbol). */
const OPCIONES_MODAL_COMPLETO = {
  initialBreakpoint: 1,
  breakpoints: [0, 1],
  handle: false,
  mode: 'md' as const,
};

@Component({
  selector: 'app-once-ideal-admin',
  templateUrl: './once-ideal-admin.component.html',
  styleUrls: ['./once-ideal-admin.component.scss'],
  imports: [IonButton, IonIcon, IonSkeletonText],
})
export class OnceIdealAdminComponent implements OnInit {
  private _jornadasService = inject(JornadasService);
  private _alineacionesService = inject(AlineacionesService);
  private _modalCtrl = inject(ModalController);
  private _alertCtrl = inject(AlertController);
  private _loadingService = inject(LoadingService);
  private _toastService = inject(ToastService);

  readonly jornadas = signal<JornadaOnceIdeal[]>([]);
  readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');

  readonly resumen = computed(() => {
    const lista = this.jornadas();
    const publicados = lista.filter((j) => j.once_ideal_id !== null).length;
    return { publicados, pendientes: lista.length - publicados, total: lista.length };
  });

  constructor() {
    addIcons({
      addOutline,
      checkmarkCircle,
      createOutline,
      eyeOutline,
      refreshOutline,
      starOutline,
      trashOutline,
      warningOutline,
    });
  }

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    if (this.jornadas().length === 0) this.estado.set('cargando');
    try {
      const res = await firstValueFrom(this._jornadasService.getJornadasOnceIdealAdmin());
      this.jornadas.set(res.data ?? []);
      this.estado.set('listo');
    } catch {
      this.estado.set('error');
    }
  }

  /** Sin puntos todavía (actas sin hacer), el selector de jugadores saldría vacío. */
  sinPuntos(j: JornadaOnceIdeal): boolean {
    return j.jugadores_puntuados === 0;
  }

  // ---------- Acciones ----------

  async crear(j: JornadaOnceIdeal) {
    if (this.sinPuntos(j)) {
      this._toastService.showErrorToast(`La jornada ${j.numero_jornada} aún no tiene puntos: haz antes sus actas.`);
      return;
    }
    await this.abrirModal({
      modo: 'crear',
      jornadaInicial: { id: j.id, numero_jornada: j.numero_jornada },
      jornadasConOnceIdeal: this.jornadas().filter((x) => x.once_ideal_id !== null),
    });
  }

  async editar(j: JornadaOnceIdeal) {
    await this.abrirModal({ modo: 'editar', jornada: { jornada_id: j.id, numero_jornada: j.numero_jornada } });
  }

  /** Igual que lo ven los usuarios. */
  async ver(j: JornadaOnceIdeal) {
    await this.abrirModal({ modo: 'ver', jornada: { jornada_id: j.id, numero_jornada: j.numero_jornada } });
  }

  async eliminar(j: JornadaOnceIdeal) {
    const alert = await this._alertCtrl.create({
      mode: 'ios',
      cssClass: ['pf-alert', 'pf-alert-peligro'],
      header: `¿Eliminar el 11 ideal de la jornada ${j.numero_jornada}?`,
      message: 'Dejará de verse en la app. Podrás volver a crearlo cuando quieras.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'destructive') return;

    this._loadingService.show('Eliminando 11 ideal...');
    try {
      const resp = await firstValueFrom(this._alineacionesService.eliminarOnceIdeal(j.id));
      this._toastService.showSuccessToast(resp.message || '11 ideal eliminado');
      this.jornadas.update((lista) =>
        lista.map((x) => (x.id === j.id ? { ...x, once_ideal_id: null, formacion_id: null, formacion: null } : x)),
      );
    } catch (error) {
      const err = error as HttpErrorResponse;
      this._toastService.showErrorToast(err.error?.message || 'No se ha podido eliminar el 11 ideal');
    } finally {
      this._loadingService.hide();
    }
  }

  private async abrirModal(props: Record<string, unknown>) {
    const modal = await this._modalCtrl.create({
      component: OnceIdealComponent,
      componentProps: props,
      ...OPCIONES_MODAL_COMPLETO,
    });
    await modal.present();
    const { role } = await modal.onWillDismiss();
    if (role === 'confirm') this.cargar();
  }
}

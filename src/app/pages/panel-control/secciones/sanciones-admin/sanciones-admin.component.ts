import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { AlertController } from '@ionic/angular/alert-controller';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, refreshOutline, shieldOutline, trashOutline, warningOutline } from 'ionicons/icons';
import { Sancion, SancionesService } from '../../../../core/services/sanciones.service';
import { Equipo, EquiposService } from '../../../../core/services/equipos-service';
import { LoadingService } from '../../../../core/services/loading.service';
import { ToastService } from '../../../../core/services/toast.service';
import { opcionesModalAuto } from '../../../../core/utils/modal-auto';
import { EditarSancionComponent } from '../../../../shared/modals/editar-sancion/editar-sancion.component';

const FORMATO_FECHA = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

@Component({
  selector: 'app-sanciones-admin',
  templateUrl: './sanciones-admin.component.html',
  styleUrls: ['./sanciones-admin.component.scss'],
  imports: [IonButton, IonIcon, IonSkeletonText],
})
export class SancionesAdminComponent implements OnInit {
  private _sancionesService = inject(SancionesService);
  private _equiposService = inject(EquiposService);
  private _modalCtrl = inject(ModalController);
  private _alertCtrl = inject(AlertController);
  private _loadingService = inject(LoadingService);
  private _toastService = inject(ToastService);

  readonly sanciones = signal<Sancion[]>([]);
  readonly equipos = signal<Equipo[]>([]);
  readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');

  /** Resumen: equipos sancionados y puntos totales restados. */
  readonly resumen = computed(() => ({
    equipos: new Set(this.sanciones().map((s) => s.equipo_id)).size,
    puntos: this.sanciones().reduce((n, s) => n + s.puntos, 0),
  }));

  constructor() {
    addIcons({ addOutline, createOutline, refreshOutline, shieldOutline, trashOutline, warningOutline });
  }

  ngOnInit() {
    this.cargar();
    this._equiposService.getEquiposLimpios().subscribe({
      next: (res: any) => this.equipos.set(res.data ?? []),
    });
  }

  async cargar() {
    if (this.sanciones().length === 0) this.estado.set('cargando');
    try {
      const res = await firstValueFrom(this._sancionesService.getSanciones());
      this.sanciones.set(res.data ?? []);
      this.estado.set('listo');
    } catch {
      this.estado.set('error');
    }
  }

  fecha(s: Sancion): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s.creada ?? '');
    return m ? FORMATO_FECHA.format(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : '';
  }

  nuevaSancion() {
    this.abrirModal(null);
  }

  editarSancion(s: Sancion) {
    this.abrirModal(s);
  }

  private async abrirModal(sancion: Sancion | null) {
    const modal = await this._modalCtrl.create({
      component: EditarSancionComponent,
      componentProps: { sancion, equipos: this.equipos() },
      ...opcionesModalAuto(),
    });
    await modal.present();
    const { role } = await modal.onWillDismiss();
    if (role === 'confirm') this.cargar();
  }

  async eliminarSancion(s: Sancion) {
    const alert = await this._alertCtrl.create({
      mode: 'ios',
      cssClass: ['pf-alert', 'pf-alert-peligro'],
      header: '¿Eliminar la sanción?',
      subHeader: `${s.equipo} · −${s.puntos} ${s.puntos === 1 ? 'punto' : 'puntos'}`,
      message: 'El equipo recuperará esos puntos en la clasificación.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'destructive') return;

    this._loadingService.show('Eliminando sanción...');
    try {
      const resp = await firstValueFrom(this._sancionesService.eliminarSancion(s.id));
      this._toastService.showSuccessToast(resp.message || 'Sanción eliminada');
      this.sanciones.update((lista) => lista.filter((x) => x.id !== s.id));
    } catch (error) {
      const err = error as HttpErrorResponse;
      this._toastService.showErrorToast(err.error?.message || 'No se ha podido eliminar la sanción');
    } finally {
      this._loadingService.hide();
    }
  }
}

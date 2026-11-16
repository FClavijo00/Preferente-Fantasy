import { Component, computed, inject, Input, signal } from '@angular/core';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonContent } from '@ionic/angular/ion-content';
import { IonIcon } from '@ionic/angular/ion-icon';
import { ModalController } from '@ionic/angular/modal-controller';
import { AlertController } from '@ionic/angular/alert-controller';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  closeOutline,
  globeOutline,
  lockClosed,
  personRemoveOutline,
  refreshOutline,
  trashOutline,
  trophyOutline,
} from 'ionicons/icons';
import { Ligas, LigasService, MiembroLiga } from '../../../core/services/ligas.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Editar la liga (solo el creador): nombre, pública/privada, código de acceso, expulsar miembros
 * y eliminar la liga. El código lo genera el servidor.
 *
 *   modalCtrl.create({ component: EditarLigaComponent, ...opcionesModalAlto(),
 *                      componentProps: { liga, miembros } })
 *
 * Al cerrar: role 'confirm' (guardada, data = liga editada), 'eliminada' o 'cancel'.
 * La liga seleccionada (LigasService) se actualiza aquí mismo al guardar.
 */
@Component({
  selector: 'app-editar-liga',
  templateUrl: './editar-liga.component.html',
  styleUrls: ['./editar-liga.component.scss'],
  imports: [IonHeader, IonContent, IonIcon],
})
export class EditarLigaComponent {
  @Input({ required: true }) set liga(l: Ligas) {
    this._liga = l;
    this.nombre.set(l.nombre_liga);
    this.privada.set(l.privada);
  }
  get liga(): Ligas {
    return this._liga;
  }
  @Input() set miembros(m: MiembroLiga[] | null | undefined) {
    this.lista.set(m ?? []);
  }

  private _liga!: Ligas;
  private _modalCtrl = inject(ModalController);
  private _alertCtrl = inject(AlertController);
  private _loadingService = inject(LoadingService);
  private _ligasService = inject(LigasService);
  private _toastService = inject(ToastService);

  readonly nombre = signal('');
  readonly privada = signal(false);
  readonly nuevoCodigo = signal(false);
  readonly lista = signal<MiembroLiga[]>([]);
  readonly enviando = signal(false);

  readonly nombreValido = computed(() => this.nombre().trim().length >= 3);
  readonly hayCambios = computed(
    () =>
      this.nombre().trim() !== this.liga.nombre_liga ||
      this.privada() !== this.liga.privada ||
      (this.privada() && this.nuevoCodigo()),
  );
  /** Miembros con el creador primero */
  readonly miembrosOrdenados = computed(() =>
    [...this.lista()].sort((a, b) => Number(this.esCreador(b)) - Number(this.esCreador(a))),
  );

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      closeOutline,
      globeOutline,
      lockClosed,
      personRemoveOutline,
      refreshOutline,
      trashOutline,
      trophyOutline,
    });
  }

  esCreador(m: MiembroLiga): boolean {
    return m.usuario_id === this.liga.creado_por;
  }

  onNombre(event: Event) {
    this.nombre.set((event.target as HTMLInputElement).value);
  }

  cambiarPrivada(valor: boolean) {
    this.privada.set(valor);
    if (!valor) this.nuevoCodigo.set(false);
  }

  guardar() {
    if (!this.nombreValido() || !this.hayCambios() || this.enviando()) return;
    this.enviando.set(true);
    this._loadingService.show('Guardando cambios...');

    this._ligasService
      .editarLiga({
        liga_id: this.liga.id,
        nombre_liga: this.nombre().trim(),
        privada: this.privada(),
        nuevo_codigo: this.privada() && this.nuevoCodigo(),
      })
      .subscribe({
        next: (resp) => {
          this._loadingService.hide();
          this.enviando.set(false);
          this._ligasService.actualizarLigaSeleccionada(resp.data);
          this._toastService.showSuccessToast(resp.message || 'Liga actualizada');
          this._modalCtrl.dismiss(resp.data, 'confirm');
        },
        error: (error) => {
          this._loadingService.hide();
          this.enviando.set(false);
          this._toastService.showErrorToast(error.error?.message || 'No se ha podido guardar la liga');
        },
      });
  }

  async confirmarExpulsar(m: MiembroLiga) {
    const alert = await this._alertCtrl.create({
      mode: 'ios',
      cssClass: ['pf-alert', 'pf-alert-peligro'],
      backdropDismiss: false,
      header: `¿Expulsar a @${m.nombre_usuario}?`,
      message: `Saldrá de «${this.liga.nombre_liga}» y perderá su equipo y sus puntos en esta liga.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Expulsar', role: 'destructive', handler: () => this.expulsar(m) },
      ],
    });
    await alert.present();
  }

  private expulsar(m: MiembroLiga) {
    this._loadingService.show();
    this._ligasService.eliminarUsuarioLiga(this.liga.id, m.usuario_id).subscribe({
      next: (resp) => {
        this._loadingService.hide();
        // Sobre la lista actual (no la inicial): así no "vuelven" los expulsados antes
        this.lista.update((lista) => lista.filter((u) => u.usuario_id !== m.usuario_id));
        this._ligasService.actualizarLigaSeleccionada({ total_participantes: this.lista().length });
        this._toastService.showSuccessToast(resp.message || 'Miembro expulsado');
      },
      error: (error) => {
        this._loadingService.hide();
        this._toastService.showErrorToast(error.error?.message || 'No se ha podido expulsar al miembro');
      },
    });
  }

  async confirmarEliminarLiga() {
    const alert = await this._alertCtrl.create({
      mode: 'ios',
      cssClass: ['pf-alert', 'pf-alert-peligro'],
      backdropDismiss: false,
      header: `¿Eliminar «${this.liga.nombre_liga}»?`,
      message:
        'Se borrará la liga para todos sus miembros, con sus alineaciones y sus puntos. Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.eliminarLiga() },
      ],
    });
    await alert.present();
  }

  private eliminarLiga() {
    this._loadingService.show('Eliminando liga...');
    this._ligasService.eliminarLiga(this.liga.id).subscribe({
      next: (resp) => {
        this._loadingService.hide();
        this._toastService.showSuccessToast(resp.message || 'Liga eliminada');
        this._modalCtrl.dismiss(null, 'eliminada');
      },
      error: (error) => {
        this._loadingService.hide();
        this._toastService.showErrorToast(error.error?.message || 'No se ha podido eliminar la liga');
      },
    });
  }

  cerrar() {
    this._modalCtrl.dismiss(null, 'cancel');
  }
}

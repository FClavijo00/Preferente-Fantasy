import { Component, inject, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { alarmOutline, closeOutline, footballOutline, megaphoneOutline, notifications, starOutline } from 'ionicons/icons';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Invitación a activar las notificaciones (la primera vez que se entra en recepción).
 * El permiso del navegador solo se pide al pulsar "Activar" (iPhone no deja pedirlo sin un toque).
 * En iPhone sin la app instalada, ofrece ver cómo instalarla: cierra con role 'instalar'.
 *
 *   modalCtrl.create({ component: ActivarNotificacionesComponent, ...opcionesModalAuto() })
 */
@Component({
  selector: 'app-activar-notificaciones',
  templateUrl: './activar-notificaciones.component.html',
  styleUrls: ['./activar-notificaciones.component.scss'],
  imports: [IonIcon],
})
export class ActivarNotificacionesComponent {
  private _modalCtrl = inject(ModalController);
  private _notificaciones = inject(NotificacionesService);
  private _toastService = inject(ToastService);

  readonly necesitaInstalar = this._notificaciones.soporte() === 'instalar';
  readonly activando = signal(false);

  readonly ventajas = [
    { icono: 'alarm-outline', texto: 'Aviso 24 h y 3 h antes de que cierre la jornada, para que no te quedes sin alineación.' },
    { icono: 'football-outline', texto: 'El resultado de cada partido en cuanto sus puntos estén disponibles.' },
    { icono: 'star-outline', texto: 'Cuándo sale el 11 ideal de la jornada.' },
    { icono: 'megaphone-outline', texto: 'Novedades y cambios importantes.' },
  ];

  constructor() {
    addIcons({ alarmOutline, closeOutline, footballOutline, megaphoneOutline, notifications, starOutline });
    this._notificaciones.marcarOfrecido(); // se ofrece una sola vez por dispositivo
  }

  async activar() {
    if (this.activando()) return;
    this.activando.set(true);
    try {
      const estado = await this._notificaciones.activar();
      if (estado === 'activadas') {
        this._toastService.showSuccessToast('¡Notificaciones activadas! Puedes elegir cuáles en tu perfil.');
        this._modalCtrl.dismiss(null, 'confirm');
      } else {
        // Ha dicho que no en el aviso del navegador
        this._modalCtrl.dismiss(null, 'cancel');
      }
    } catch (error) {
      const err = error as { error?: { message?: string }; message?: string };
      this._toastService.showErrorToast(err.error?.message || err.message || 'No se han podido activar');
      this.activando.set(false);
    }
  }

  verComoInstalar() {
    this._modalCtrl.dismiss(null, 'instalar');
  }

  cerrar() {
    this._modalCtrl.dismiss(null, 'cancel');
  }
}

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { AlertController } from '@ionic/angular/alert-controller';
import { addIcons } from 'ionicons';
import {
  alarmOutline,
  footballOutline,
  megaphoneOutline,
  notificationsOutline,
  paperPlaneOutline,
  phonePortraitOutline,
  refreshOutline,
  starOutline,
} from 'ionicons/icons';
import { AvisoEnviado, NotificacionesService } from '../../../../core/services/notificaciones.service';
import { ToastService } from '../../../../core/services/toast.service';

const DESTINOS = [
  { url: '/recepcion', texto: 'Mis ligas (recepción)' },
  { url: '/tabs/home', texto: 'Inicio' },
  { url: '/tabs/alineacion', texto: 'Alineación' },
  { url: '/tabs/clasificaciones', texto: 'Clasificación' },
];

const TIPOS: Record<string, { texto: string; icono: string }> = {
  aviso: { texto: 'Aviso', icono: 'megaphone-outline' },
  acta: { texto: 'Resultado', icono: 'football-outline' },
  once_ideal: { texto: '11 ideal', icono: 'star-outline' },
  recordatorio_24h: { texto: 'Cierre 24 h', icono: 'alarm-outline' },
  recordatorio_3h: { texto: 'Cierre 3 h', icono: 'alarm-outline' },
};

const FORMATO = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Madrid',
});

/**
 * Panel → Avisos: notificación push con mensaje libre a todos los que tengan "Avisos" activado,
 * e historial de todo lo enviado (también los automáticos: resultados, cierre de jornada, 11 ideal).
 */
@Component({
  selector: 'app-avisos-admin',
  templateUrl: './avisos-admin.component.html',
  styleUrls: ['./avisos-admin.component.scss'],
  imports: [IonButton, IonIcon, IonSkeletonText],
})
export class AvisosAdminComponent implements OnInit {
  private _notificaciones = inject(NotificacionesService);
  private _alertCtrl = inject(AlertController);
  private _toastService = inject(ToastService);

  readonly destinos = DESTINOS;
  readonly titulo = signal('');
  readonly mensaje = signal('');
  readonly destino = signal(DESTINOS[0].url);
  readonly enviando = signal(false);

  readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');
  readonly historial = signal<AvisoEnviado[]>([]);
  readonly dispositivos = signal(0);
  readonly usuarios = signal(0);
  readonly configurado = signal(true);

  readonly valido = computed(() => {
    const t = this.titulo().trim().length;
    const m = this.mensaje().trim().length;
    return t >= 3 && t <= 80 && m >= 3 && m <= 250;
  });

  constructor() {
    addIcons({
      alarmOutline,
      footballOutline,
      megaphoneOutline,
      notificationsOutline,
      paperPlaneOutline,
      phonePortraitOutline,
      refreshOutline,
      starOutline,
    });
  }

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    this.estado.set('cargando');
    try {
      const res = await firstValueFrom(this._notificaciones.getHistorialAvisos());
      this.historial.set(res.data.historial);
      this.dispositivos.set(res.data.dispositivos);
      this.usuarios.set(res.data.usuarios);
      this.configurado.set(res.data.configurado);
      this.estado.set('listo');
    } catch {
      this.estado.set('error');
    }
  }

  texto(campo: 'titulo' | 'mensaje', event: Event) {
    (campo === 'titulo' ? this.titulo : this.mensaje).set((event.target as HTMLInputElement).value);
  }

  tipo(a: AvisoEnviado) {
    return TIPOS[a.tipo] ?? { texto: a.tipo, icono: 'notifications-outline' };
  }

  fecha(a: AvisoEnviado): string {
    return FORMATO.format(new Date(a.created_at));
  }

  async confirmarEnvio() {
    if (!this.valido() || this.enviando()) return;
    const alert = await this._alertCtrl.create({
      mode: 'ios',
      cssClass: 'pf-alert',
      header: '¿Enviar el aviso?',
      message: `Les llegará a ${this.usuarios()} usuario${this.usuarios() === 1 ? '' : 's'} con los avisos activados. No se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Enviar', handler: () => this.enviar() },
      ],
    });
    await alert.present();
  }

  private async enviar() {
    this.enviando.set(true);
    try {
      const res = await firstValueFrom(
        this._notificaciones.enviarAviso({
          titulo: this.titulo().trim(),
          mensaje: this.mensaje().trim(),
          url: this.destino(),
        }),
      );
      this._toastService.showSuccessToast(res.message || 'Aviso enviado');
      this.titulo.set('');
      this.mensaje.set('');
      this.cargar();
    } catch (error) {
      const err = error as { error?: { message?: string } };
      this._toastService.showErrorToast(err.error?.message || 'No se ha podido enviar el aviso');
    } finally {
      this.enviando.set(false);
    }
  }
}

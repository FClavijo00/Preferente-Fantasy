import { Component, DestroyRef, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSpinner } from '@ionic/angular/ion-spinner';
import { AlertController } from '@ionic/angular/alert-controller';
import { addIcons } from 'ionicons';
import {
  checkmarkOutline,
  copyOutline,
  keyOutline,
  peopleOutline,
  searchOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { UsuarioAdmin, UsuariosAdminService } from '../../../../core/services/usuarios-admin.service';
import { AuthService } from '../../../../core/services/auth-service.service';
import { ToastService } from '../../../../core/services/toast.service';

const ROL_ADMIN = 1;
const FORMATO_ALTA = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Panel → Usuarios: buscar a un usuario y restablecerle la contraseña cuando la ha olvidado.
 * La contraseña temporal solo se ve aquí, una vez, para pasársela por privado.
 */
@Component({
  selector: 'app-usuarios-admin',
  templateUrl: './usuarios-admin.component.html',
  styleUrls: ['./usuarios-admin.component.scss'],
  imports: [IonIcon, IonSpinner],
})
export class UsuariosAdminComponent {
  private _usuarios = inject(UsuariosAdminService);
  private _auth = inject(AuthService);
  private _alertCtrl = inject(AlertController);
  private _toastService = inject(ToastService);

  readonly texto = signal('');
  readonly estado = signal<'inicio' | 'buscando' | 'listo' | 'error'>('inicio');
  readonly resultados = signal<UsuarioAdmin[]>([]);
  /** Usuario al que se le está restableciendo (spinner en su botón) */
  readonly restableciendo = signal<number | null>(null);
  /** Contraseñas temporales recién generadas, por usuario (solo en memoria) */
  readonly temporales = signal<Record<number, string>>({});
  readonly copiado = signal<number | null>(null);

  readonly miId = this._auth.currentUser()?.id ?? null;
  private espera: ReturnType<typeof setTimeout> | undefined;
  private busqueda = 0;

  constructor() {
    addIcons({ checkmarkOutline, copyOutline, keyOutline, peopleOutline, searchOutline, shieldCheckmarkOutline });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.espera));
  }

  /** Busca al dejar de escribir (300 ms) */
  escribir(event: Event) {
    this.texto.set((event.target as HTMLInputElement).value);
    clearTimeout(this.espera);
    if (this.texto().trim().length < 2) {
      this.estado.set('inicio');
      this.resultados.set([]);
      return;
    }
    this.espera = setTimeout(() => this.buscar(), 300);
  }

  async buscar() {
    const texto = this.texto().trim();
    if (texto.length < 2) return;
    const id = ++this.busqueda;
    this.estado.set('buscando');
    try {
      const res = await firstValueFrom(this._usuarios.buscar(texto));
      if (id !== this.busqueda) return; // llegó tarde: ya se está buscando otra cosa
      this.resultados.set(res.data);
      this.estado.set('listo');
    } catch {
      if (id === this.busqueda) this.estado.set('error');
    }
  }

  esAdmin(u: UsuarioAdmin) {
    return u.rol_id === ROL_ADMIN;
  }

  alta(u: UsuarioAdmin): string {
    return FORMATO_ALTA.format(new Date(u.created_at));
  }

  async confirmarRestablecer(u: UsuarioAdmin) {
    const alert = await this._alertCtrl.create({
      mode: 'ios',
      cssClass: ['pf-alert', 'pf-alert-peligro'], // estilos en src/theme/alerts.scss
      header: '¿Restablecer la contraseña?',
      subHeader: `${u.nombre_usuario} · ${u.email}`,
      message:
        'Su contraseña actual dejará de funcionar y se generará una temporal para que se la pases. ' +
        'Asegúrate antes de que es él quien te lo pide.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Restablecer', role: 'destructive', handler: () => this.restablecer(u) },
      ],
    });
    await alert.present();
  }

  private async restablecer(u: UsuarioAdmin) {
    this.restableciendo.set(u.id);
    try {
      const res = await firstValueFrom(this._usuarios.restablecerPassword(u.id));
      this.temporales.update((t) => ({ ...t, [u.id]: res.data.password_temporal }));
      this._toastService.showSuccessToast(res.message || 'Contraseña restablecida');
    } catch (error) {
      const err = error as { error?: { message?: string } };
      this._toastService.showErrorToast(err.error?.message || 'No se ha podido restablecer la contraseña');
    } finally {
      this.restableciendo.set(null);
    }
  }

  /** Copia un mensaje listo para mandar por WhatsApp con la contraseña temporal */
  async copiar(u: UsuarioAdmin) {
    const temporal = this.temporales()[u.id];
    if (!temporal) return;
    const mensaje =
      `Hola ${u.nombre_usuario}, te he restablecido la contraseña de Preferente Fantasy.\n` +
      `Entra con tu correo (${u.email}) y esta contraseña temporal: ${temporal}\n` +
      `Después cámbiala en Perfil → Cambiar contraseña.`;
    try {
      await navigator.clipboard.writeText(mensaje);
      this.copiado.set(u.id);
      setTimeout(() => this.copiado.update((c) => (c === u.id ? null : c)), 2000);
    } catch {
      this._toastService.showErrorToast('No se ha podido copiar: cópiala a mano');
    }
  }
}

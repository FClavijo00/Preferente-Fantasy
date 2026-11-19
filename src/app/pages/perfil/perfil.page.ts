import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IonContent } from '@ionic/angular/ion-content';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { ModalController } from '@ionic/angular/modal-controller';
import { AlertController } from '@ionic/angular/alert-controller';
import { NavController } from '@ionic/angular/nav-controller';
import { addIcons } from 'ionicons';
import {
  alarmOutline,
  bookOutline,
  calculatorOutline,
  footballOutline,
  megaphoneOutline,
  notificationsOffOutline,
  notificationsOutline,
  paperPlaneOutline,
  starOutline,
  caretDown,
  caretUp,
  chevronForward,
  copyOutline,
  createOutline,
  downloadOutline,
  exitOutline,
  globeOutline,
  lockClosed,
  lockClosedOutline,
  logoInstagram,
  logOutOutline,
  shareSocialOutline,
  trashOutline,
  trophyOutline,
} from 'ionicons/icons';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AuthService } from '../../core/services/auth-service.service';
import { LigasService, MiembroLiga } from '../../core/services/ligas.service';
import { ClasificacionesService, FilaClasificacionLiga } from '../../core/services/clasificaciones.service';
import { JornadasService } from '../../core/services/jornadas-service';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';
import { opcionesModalAlto, opcionesModalAuto } from '../../core/utils/modal-auto';
import { compartirLiga, copiarTexto } from '../../core/utils/compartir-liga';
import { APP_VERSION } from '../../core/version';
import { CambiarPasswordComponent } from '../../shared/modals/cambiar-password/cambiar-password.component';
import { EditarPerfilComponent } from '../../shared/modals/editar-perfil/editar-perfil.component';
import { EditarLigaComponent } from '../../shared/modals/editar-liga/editar-liga.component';
import { InfoPuntuacionComponent } from '../../shared/modals/info-puntuacion/info-puntuacion.component';
import { ReglamentoComponent } from '../../shared/modals/reglamento/reglamento.component';
import { InstalarAppComponent } from '../../shared/modals/instalar-app/instalar-app.component';
import { estaInstalada } from '../../core/utils/instalar-app';
import { NotificacionesService, PreferenciasNotificaciones } from '../../core/services/notificaciones.service';

/** Mis números en la liga actual (tarjeta "Liga actual") */
interface MisDatosLiga {
  posicion: number | null;
  puntos: number;
  movimiento: number | null;
  jornadas: number;
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  imports: [IonContent, IonIcon, IonSkeletonText, HeaderComponent],
})
export class PerfilPage {
  private _authService = inject(AuthService);
  private _ligasService = inject(LigasService);
  private _clasificacionesService = inject(ClasificacionesService);
  private _jornadasService = inject(JornadasService);
  private _modalCtrl = inject(ModalController);
  private _alertCtrl = inject(AlertController);
  private _navCtrl = inject(NavController);
  private _loadingService = inject(LoadingService);
  private _toastService = inject(ToastService);
  private _notificaciones = inject(NotificacionesService);

  readonly version = APP_VERSION;
  /** Abierta desde el icono de la pantalla de inicio: no hace falta ofrecer instalarla */
  readonly instalada = estaInstalada();

  /** Usuario de la sesión: se actualiza solo al editar el perfil */
  readonly user = this._authService.currentUser;
  readonly liga = this._ligasService.ligaSeleccionada;
  readonly soyCreador = computed(() => {
    const u = this.user();
    const l = this.liga();
    return !!u && !!l && u.id === l.creado_por;
  });

  /** null mientras carga */
  readonly miembros = signal<MiembroLiga[] | null>(null);
  readonly numMiembros = computed(() => this.miembros()?.length ?? this.liga()?.total_participantes ?? 0);
  readonly misDatos = signal<MisDatosLiga | null>(null);
  readonly estadoDatos = signal<'cargando' | 'listo' | 'error'>('cargando');

  constructor() {
    addIcons({
      alarmOutline,
      bookOutline,
      calculatorOutline,
      footballOutline,
      megaphoneOutline,
      notificationsOffOutline,
      notificationsOutline,
      paperPlaneOutline,
      starOutline,
      caretDown,
      caretUp,
      chevronForward,
      copyOutline,
      createOutline,
      downloadOutline,
      exitOutline,
      globeOutline,
      lockClosed,
      lockClosedOutline,
      logoInstagram,
      logOutOutline,
      shareSocialOutline,
      trashOutline,
      trophyOutline,
    });
  }

  ionViewWillEnter() {
    this.cargarPerfil();
    this.cargarDatosLiga();
    this.cargarNotificaciones();
  }

  // ---------- Notificaciones ----------

  readonly soportePush = this._notificaciones.soporte();
  readonly estadoPush = this._notificaciones.estado;
  readonly preferencias = signal<PreferenciasNotificaciones | null>(null);
  readonly cambiandoPush = signal(false);
  readonly tiposPush: { id: keyof PreferenciasNotificaciones; titulo: string; sub: string; icono: string }[] = [
    { id: 'actas', titulo: 'Resultados', sub: 'Al cerrarse el acta de cada partido', icono: 'football-outline' },
    { id: 'recordatorios', titulo: 'Cierre de jornada', sub: '24 h y 3 h antes de la fecha límite', icono: 'alarm-outline' },
    { id: 'once_ideal', titulo: '11 ideal', sub: 'Cuando se publica el de la jornada', icono: 'star-outline' },
    { id: 'avisos', titulo: 'Avisos', sub: 'Novedades y cambios importantes', icono: 'megaphone-outline' },
  ];

  private async cargarNotificaciones() {
    const estado = await this._notificaciones.comprobarEstado();
    if (estado === 'activadas' && !this.preferencias()) {
      this._notificaciones.getPreferencias().subscribe({
        next: (resp) => this.preferencias.set(resp.data),
        error: () => undefined,
      });
    }
  }

  async alternarNotificaciones() {
    if (this.cambiandoPush()) return;
    this.cambiandoPush.set(true);
    try {
      if (this.estadoPush() === 'activadas') {
        await this._notificaciones.desactivar();
        this._toastService.showSuccessToast('Notificaciones desactivadas en este dispositivo');
      } else {
        const estado = await this._notificaciones.activar();
        if (estado === 'activadas') {
          this._toastService.showSuccessToast('¡Notificaciones activadas!');
          await this.cargarNotificaciones();
        } else if (estado === 'bloqueadas') {
          this._toastService.showErrorToast('Las has bloqueado: permítelas en los ajustes del navegador');
        }
      }
    } catch (error) {
      const err = error as { error?: { message?: string }; message?: string };
      this._toastService.showErrorToast(err.error?.message || err.message || 'No se han podido cambiar las notificaciones');
    } finally {
      this.cambiandoPush.set(false);
    }
  }

  alternarTipo(tipo: keyof PreferenciasNotificaciones) {
    const actuales = this.preferencias();
    if (!actuales) return;
    const nuevas = { ...actuales, [tipo]: !actuales[tipo] };
    this.preferencias.set(nuevas); // al momento; si falla, se deshace
    this._notificaciones.guardarPreferencias(nuevas).subscribe({
      next: (resp) => this.preferencias.set(resp.data),
      error: () => {
        this.preferencias.set(actuales);
        this._toastService.showErrorToast('No se ha podido guardar');
      },
    });
  }

  enviarPrueba() {
    this._notificaciones.enviarPrueba().subscribe({
      next: (resp) => this._toastService.showSuccessToast(resp.message || 'Prueba enviada'),
      error: (error) => this._toastService.showErrorToast(error.error?.message || 'No se ha podido enviar la prueba'),
    });
  }

  /** Refresca el usuario de la sesión (por si cambió en otro dispositivo) */
  private cargarPerfil() {
    this._authService.cargarPerfil().subscribe({
      next: (resp) => {
        if (resp.ok && resp.data) this._authService.setSession(resp.data);
      },
      error: () => {
        // Nos quedamos con lo que había en la sesión
      },
    });
  }

  private async cargarDatosLiga() {
    const liga = this.liga();
    const usuario = this.user();
    if (!liga || !usuario) return;

    this.cargarMiembros();

    // Solo la primera vez se ve el esqueleto; al volver a la pestaña se refresca sin parpadeo
    if (!this.misDatos()) this.estadoDatos.set('cargando');
    try {
      const [clasificacion, jornadas] = await Promise.all([
        firstValueFrom(this._clasificacionesService.getClasificacion(liga.id)),
        firstValueFrom(this._jornadasService.getPuntuacionesJornadas(liga.id, usuario.id)),
      ]);
      const mia: FilaClasificacionLiga | undefined = (clasificacion.data ?? []).find(
        (f) => f.usuario_id === usuario.id,
      );
      this.misDatos.set({
        posicion: mia?.posicion ?? null,
        puntos: mia?.puntos_totales ?? 0,
        movimiento: mia?.movimiento ?? null,
        jornadas: jornadas.data?.length ?? 0,
      });
      this.estadoDatos.set('listo');
    } catch {
      this.estadoDatos.set('error');
    }
  }

  private cargarMiembros() {
    const liga = this.liga();
    if (!liga) return;
    this._ligasService.cargarUsuariosLiga(liga.id).subscribe({
      next: (resp) => this.miembros.set(resp.data ?? []),
      error: () => {
        // numMiembros tira de total_participantes de la liga
      },
    });
  }

  // ---------- Código de acceso ----------

  async copiarCodigo() {
    const codigo = this.liga()?.codigo_acceso;
    if (!codigo) return;
    if (await copiarTexto(codigo)) this._toastService.showSuccessToast('Código copiado');
    else this._toastService.showErrorToast('No se ha podido copiar el código');
  }

  async compartirCodigo() {
    const liga = this.liga();
    if (!liga?.codigo_acceso) return;
    const resultado = await compartirLiga(liga.nombre_liga, liga.codigo_acceso);
    if (resultado === 'copiado') this._toastService.showSuccessToast('Código copiado');
    else if (resultado === 'error') this._toastService.showErrorToast('No se ha podido compartir el código');
  }

  // ---------- Modales ----------

  async abrirEditarPerfil() {
    const modal = await this._modalCtrl.create({
      component: EditarPerfilComponent,
      ...opcionesModalAlto(),
      componentProps: { userData: this.user() },
    });
    await modal.present();
    // El modal ya guarda el usuario en la sesión y "user" se actualiza solo
    const { role } = await modal.onWillDismiss();
    if (role === 'confirm') this.cargarMiembros();
  }

  async abrirEditarLiga() {
    const liga = this.liga();
    if (!liga) return;
    const modal = await this._modalCtrl.create({
      component: EditarLigaComponent,
      ...opcionesModalAlto(),
      componentProps: { liga, miembros: this.miembros() ?? [] },
    });
    await modal.present();

    const { role } = await modal.onWillDismiss();
    if (role === 'eliminada') {
      this.salirALasLigas();
      return;
    }
    // Ha podido expulsar a alguien aunque cancele los cambios del formulario
    this.cargarMiembros();
  }

  async abrirCambiarPassword() {
    const modal = await this._modalCtrl.create({
      component: CambiarPasswordComponent,
      ...opcionesModalAuto(),
    });
    await modal.present();
  }

  async abrirInstalarApp() {
    const modal = await this._modalCtrl.create({
      component: InstalarAppComponent,
      ...opcionesModalAuto(),
    });
    await modal.present();
  }

  async abrirReglamento() {
    const modal = await this._modalCtrl.create({
      component: ReglamentoComponent,
      ...opcionesModalAuto(),
    });
    await modal.present();
  }

  async abrirPuntuacion() {
    const modal = await this._modalCtrl.create({
      component: InfoPuntuacionComponent,
      ...opcionesModalAuto(),
    });
    await modal.present();
  }

  abrirInstagram() {
    window.open('https://instagram.com/preferentefantasy', '_blank', 'noopener');
  }

  // ---------- Abandonar liga ----------

  async abrirAbandonarLiga() {
    const liga = this.liga();
    if (!liga) return;

    const soloYo = this.numMiembros() <= 1;
    let message = 'Perderás tus alineaciones y tus puntos en esta liga. Esta acción no se puede deshacer.';
    if (soloYo) {
      message =
        'Eres el único miembro: si la abandonas, la liga se borrará junto con tu equipo y tus puntos. Esta acción no se puede deshacer.';
    } else if (this.soyCreador()) {
      message =
        'Perderás tus alineaciones y tus puntos en esta liga, y la administración pasará al siguiente miembro que entró. Esta acción no se puede deshacer.';
    }

    const alert = await this._alertCtrl.create({
      mode: 'ios',
      cssClass: ['pf-alert', 'pf-alert-peligro'],
      backdropDismiss: false,
      header: `¿Abandonar «${liga.nombre_liga}»?`,
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Abandonar', role: 'destructive', handler: () => this.abandonarLiga(liga.id) },
      ],
    });
    await alert.present();
  }

  private abandonarLiga(ligaId: number) {
    this._loadingService.show('Saliendo de la liga...');
    this._ligasService.abandonarLiga(ligaId).subscribe({
      next: (resp) => {
        this._loadingService.hide();
        this._toastService.showSuccessToast(resp.message || 'Has abandonado la liga');
        this.salirALasLigas();
      },
      error: (error) => {
        this._loadingService.hide();
        this._toastService.showErrorToast(error.error?.message || 'No se ha podido abandonar la liga');
      },
    });
  }

  private salirALasLigas() {
    this._ligasService.clearLigaSeleccionada();
    this._navCtrl.navigateBack(['/recepcion']);
  }

  // ---------- Sesión y cuenta ----------

  async cerrarSesion() {
    // Antes de borrar el token: este dispositivo deja de recibir las notificaciones de esta cuenta
    await this._notificaciones.desvincular();
    this._ligasService.clearLigaSeleccionada();
    this._authService.logout();
  }

  async abrirEliminarCuenta() {
    const alert = await this._alertCtrl.create({
      mode: 'ios',
      cssClass: ['pf-alert', 'pf-alert-peligro'],
      backdropDismiss: false,
      header: 'Eliminar cuenta',
      message:
        'Se borrarán tu perfil, tus equipos y tus puntos en todas tus ligas. Las ligas que creaste pasarán al siguiente miembro, o se borrarán si estás solo. Esta acción no se puede deshacer.',
      inputs: [
        {
          name: 'password',
          type: 'password',
          placeholder: 'Tu contraseña',
          attributes: { autocomplete: 'current-password' },
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: (data: { password: string }) => {
            if (!data.password) {
              this._toastService.showErrorToast('Introduce tu contraseña para confirmar.');
              return false; // mantiene el aviso abierto
            }
            this.eliminarCuenta(data.password);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private eliminarCuenta(password: string) {
    this._loadingService.show('Eliminando cuenta...');
    this._authService.eliminarCuenta(password).subscribe({
      next: () => {
        this._loadingService.hide();
        this._authService.clearSession();
        this._ligasService.clearLigaSeleccionada();
        this._navCtrl.navigateRoot('/landing-page', { replaceUrl: true });
        this._toastService.showSuccessToast('Tu cuenta se ha eliminado. ¡Gracias por jugar!');
      },
      error: (error) => {
        this._loadingService.hide();
        this._toastService.showErrorToast(error.error?.message || 'No se ha podido eliminar la cuenta.');
      },
    });
  }
}

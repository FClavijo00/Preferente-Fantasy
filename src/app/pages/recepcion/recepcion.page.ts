import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IonContent } from '@ionic/angular/ion-content';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonRefresher } from '@ionic/angular/ion-refresher';
import { IonRefresherContent } from '@ionic/angular/ion-refresher-content';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { ModalController } from '@ionic/angular/modal-controller';
import { NavController } from '@ionic/angular/nav-controller';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  arrowForwardOutline,
  copyOutline,
  enterOutline,
  globeOutline,
  lockClosedOutline,
  peopleOutline,
  powerOutline,
  refreshOutline,
  shareSocialOutline,
  sparklesOutline,
  trophy,
} from 'ionicons/icons';
import { CrearUnirCampeonatoComponent } from '../../shared/modals/crear-unir-campeonato/crear-unir-campeonato.component';
import { AuthService } from '../../core/services/auth-service.service';
import { Ligas, LigasService } from '../../core/services/ligas.service';
import { ToastService } from '../../core/services/toast.service';
import { compartirLiga } from '../../core/utils/compartir-liga';
import { EstadoAlineacionService } from '../../core/services/estado-alineacion.service';

const ROL_ADMIN = 1;

type EstadoCarga = 'cargando' | 'listo' | 'error';

@Component({
  selector: 'app-recepcion',
  templateUrl: './recepcion.page.html',
  styleUrls: ['./recepcion.page.scss'],
  imports: [IonContent, IonButton, IonIcon, IonRefresher, IonRefresherContent, IonSkeletonText],
})
export class RecepcionPage implements OnInit {
  private _modalCtrl = inject(ModalController);
  private _authService = inject(AuthService);
  private _navCtrl = inject(NavController);
  private _ligasService = inject(LigasService);
  private _toastService = inject(ToastService);
  private _estadoAlineacion = inject(EstadoAlineacionService);

  readonly user = this._authService.currentUser;
  readonly esAdmin = computed(() => this.user()?.rol_id === ROL_ADMIN);

  readonly misLigas = signal<Ligas[]>([]);
  readonly estado = signal<EstadoCarga>('cargando');

  constructor() {
    addIcons({
      addCircleOutline,
      arrowForwardOutline,
      copyOutline,
      enterOutline,
      globeOutline,
      lockClosedOutline,
      peopleOutline,
      powerOutline,
      refreshOutline,
      shareSocialOutline,
      sparklesOutline,
      trophy,
    });
  }

  ngOnInit() {
    this.cargarMisLigas();
  }

  /** Badge de la alineación de la próxima jornada en cada liga. */
  avisoAlineacion(ligaId: number) {
    return this._estadoAlineacion.aviso(ligaId);
  }

  async cargarMisLigas() {
    // En recargas no vaciamos la lista: el usuario sigue viendo sus ligas mientras tanto
    if (this.misLigas().length === 0) this.estado.set('cargando');

    // Los avisos de alineación se cargan a la vez (si fallan, simplemente no se muestran)
    this._estadoAlineacion.cargar();
    try {
      const res = await firstValueFrom(this._ligasService.getMisLigas());
      this.misLigas.set(res.data);
      this.estado.set('listo');
    } catch {
      // Si la sesión ha caducado ya se encarga el interceptor; aquí solo dejamos reintentar
      this.estado.set('error');
    }
  }

  async recargar(event: CustomEvent) {
    await this.cargarMisLigas();
    (event.target as HTMLIonRefresherElement).complete();
  }

  async abrirModal(modo: 'crear' | 'unir') {
    // Móvil: sheet desde abajo que se cierra deslizando. Escritorio: tarjeta centrada.
    // Los dos se ajustan al contenido (estilos en src/theme/modal-auto.scss)
    const esEscritorio = window.matchMedia('(min-width: 768px)').matches;

    const modal = await this._modalCtrl.create({
      component: CrearUnirCampeonatoComponent,
      componentProps: { modo },
      mode: 'ios',
      cssClass: esEscritorio ? 'pf-dialogo' : 'pf-sheet',
      ...(esEscritorio ? {} : { initialBreakpoint: 1, breakpoints: [0, 1] }),
    });
    await modal.present();

    // Se recarga siempre: si se crea una liga y luego se cierra deslizando,
    // el modal no puede devolver 'confirm' y la lista se quedaría sin actualizar
    await modal.onWillDismiss();
    this.cargarMisLigas();
  }

  entrarEnLiga(liga: Ligas) {
    this._ligasService.setLigaSeleccionada(liga);
    this._navCtrl.navigateRoot(['/tabs/home'], { replaceUrl: true });
  }

  async compartirCodigo(event: Event, liga: Ligas) {
    // Que el toque en el botón no abra también la liga
    event.stopPropagation();
    if (!liga.codigo_acceso) return;

    const resultado = await compartirLiga(liga.nombre_liga, liga.codigo_acceso);
    if (resultado === 'copiado') {
      this._toastService.showSuccessToast(`Código ${liga.codigo_acceso} copiado`);
    } else if (resultado === 'error') {
      this._toastService.showErrorToast('No se ha podido copiar el código');
    }
  }

  abrirPanelDeControl() {
    this._navCtrl.navigateRoot(['/panel-control'], { replaceUrl: true });
  }

  logout() {
    this._authService.logout();
  }
}

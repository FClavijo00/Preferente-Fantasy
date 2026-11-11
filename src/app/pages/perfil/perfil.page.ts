import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonList } from '@ionic/angular/ion-list';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonItem } from '@ionic/angular/ion-item';
import { IonButton } from '@ionic/angular/ion-button';
import { ModalController } from '@ionic/angular/modal-controller';
import { AlertController } from '@ionic/angular/alert-controller';
import { NavController } from '@ionic/angular/nav-controller';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AuthService } from '../../core/services/auth-service.service';
import {
  createOutline,
  lockClosedOutline,
  logoInstagram,
  documentTextOutline,
  logOutOutline,
  trashOutline,
  trophyOutline,
} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { CambiarPasswordComponent } from '../../shared/modals/cambiar-password/cambiar-password.component';
import { EditarPerfilComponent } from '../../shared/modals/editar-perfil/editar-perfil.component';
import { LoadingService } from '../../core/services/loading.service';
import { LigasService } from '../../core/services/ligas.service';
import { ToastService } from '../../core/services/toast.service';
import { asyncScheduler } from 'rxjs';
import { EditarLigaComponent } from '../../shared/modals/editar-liga/editar-liga.component';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  imports: [
    IonButton,
    IonItem,
    IonLabel,
    IonIcon,
    IonList,
    IonContent,
    CommonModule,
    FormsModule,
    HeaderComponent,
  ],
})
export class PerfilPage implements OnInit {
  private _authService = inject(AuthService);
  private _modalCtrl = inject(ModalController);
  private _loadingService = inject(LoadingService);
  private _ligasService = inject(LigasService);
  private _alertCtrl = inject(AlertController);
  private _toastService = inject(ToastService);
  private _navCtrl = inject(NavController);

  user = signal<any>(null);
  liga = this._ligasService.ligaSeleccionada();
  usersLiga = signal<any>([]);

  constructor() {
    addIcons({
      createOutline,
      lockClosedOutline,
      logoInstagram,
      documentTextOutline,
      logOutOutline,
      trashOutline,
      trophyOutline,
    });
  }

  abrirInstagram() {
    window.open('https://instagram.com/preferentefantasy', '_system');
  }

  async abrirEditarPerfil() {
    const modal = await this._modalCtrl.create({
      component: EditarPerfilComponent,
      initialBreakpoint: 1,
      breakpoints: [0, 0.5, 0.75, 1],
      handle: false,
      mode: 'md',
      componentProps: {
        userData: this.user(),
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) {
      this._loadingService.show();
      this.user.set(data);
      this._loadingService.hide();
    }
  }

  async abrirEditarLiga() {
    const modal = await this._modalCtrl.create({
      component: EditarLigaComponent,
      initialBreakpoint: 1,
      breakpoints: [0, 0.5, 0.75, 1],
      handle: false,
      mode: 'md',
      componentProps: {
        userData: this.user(),
        ligaData: this.liga,
        ligaUsers: this.usersLiga(),
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) {
      this._loadingService.show();
      console.log(data);
      this._ligasService.clearLigaSeleccionada();
      this._navCtrl.navigateBack(['recepcion']);
      this._loadingService.hide();
    } else if (role === 'cancel') {
      this.cargarUsuariosLiga();
    }
  }

  async abrirCambiarPassword() {
    const modal = await this._modalCtrl.create({
      component: CambiarPasswordComponent,
      cssClass: 'card-modal-center',
      backdropDismiss: true,
    });

    await modal.present();
  }

  abrirBasesReglamento() {
    // Abrir modal con las normas/puntuación de Preferente Fantasy
  }

  async abrirAbandonarLiga() {
    if (this.usersLiga().length > 1) {
      const alert = await this._alertCtrl.create({
        mode: 'ios',
        backdropDismiss: false,
        header: `Abandonar "${this.liga?.nombre_liga}"`,
        message:
          'Perderás todas tus alineaciones y puntos. ¿Deseas abandonar la liga?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
          },
          {
            text: 'Abandonar',
            handler: () => {
              this.abandonarLiga();
            },
          },
        ],
      });

      await alert.present();
    } else {
      const alert = await this._alertCtrl.create({
        mode: 'ios',
        backdropDismiss: false,
        header: `Abandonar "${this.liga?.nombre_liga}"`,
        message:
          `Eres el unico usuario en la liga. Si abandonas la liga, perderas tu equipo y puntos y además, desaparecerá tu liga. ¿Deseas abandonar la liga?`,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
          },
          {
            text: 'Abandonar',
            handler: () => {
              this.abandonarLiga();
            },
          },
        ],
      });

      await alert.present();
    }
  }

  private abandonarLiga() {
    this._loadingService.show();
    let data = {
      liga_id: this.liga?.id,
      user_id: this.user()?.id,
    };
    this._ligasService.abandonarLiga(data).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this._loadingService.hide();
          this._ligasService.clearLigaSeleccionada();
          this._navCtrl.navigateBack(['recepcion']);
          this._toastService.showSuccessToast(resp.message);
        }
      },
      error: (error: any) => {
        this._loadingService.hide();
        this._toastService.showErrorToast('Error al abandonar liga');
      },
    });
  }

  cargarDatosUsuario() {
    this._loadingService.show();
    this._authService.cargarPerfil().subscribe(
      (resp: any) => {
        if (resp.ok) {
          this.user.set(resp.data);
          this._authService.setSession(resp.data);
          this._loadingService.hide();
        }
      },
      (error: any) => {
        this._loadingService.hide();
      },
    );
  }

  cargarUsuariosLiga() {
    let data = {
      liga_id: this.liga?.id,
    };
    this._ligasService.cargarUsuariosLiga(data).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.usersLiga.set(resp.data);
        }
      },
      error: (error: any) => {
        this._toastService.showErrorToast(error.message);
      },
    });
  }

  cerrarSesion() {
    this._authService.logout();
  }

  async abrirEliminarCuenta() {
    const alert = await this._alertCtrl.create({
      mode: 'ios',
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

  ngOnInit() {
    this.cargarDatosUsuario();
    this.cargarUsuariosLiga();
  }
}

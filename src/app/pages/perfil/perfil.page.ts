import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonIcon,
  IonLabel,
  IonItem,
  IonButton,
  ModalController,
} from '@ionic/angular';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AuthService } from '../../core/services/auth-service.service';
import { createOutline, lockClosedOutline, logoInstagram, documentTextOutline, logOutOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { CambiarPasswordComponent } from '../../shared/modals/cambiar-password/cambiar-password.component';
import { EditarPerfilComponent } from '../../shared/modals/editar-perfil/editar-perfil.component';
import { LoadingService } from '../../core/services/loading.service';

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
    HeaderComponent
],
})
export class PerfilPage implements OnInit {

  private _authService = inject(AuthService);
  private _modalCtrl = inject(ModalController);
  private _loadingService = inject(LoadingService);

  user = signal<any>(null);

  constructor() {
    addIcons({ 
      createOutline, lockClosedOutline, logoInstagram, 
      documentTextOutline, logOutOutline 
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
        userData: this.user()
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) {
      this._loadingService.show();
      this.user.set(data);
      this._loadingService.hide();
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

  cargarDatosUsuario() {
    /* const usuarioActual = this._authService.getUser();
    this.user.set(usuarioActual); */
    this._loadingService.show();
    let userID = this._authService.getUser()?.id;
    this._authService.cargarPerfil(userID).subscribe((resp: any) => {
      if (resp.ok) {
        this.user.set(resp.data);
        this._authService.setCurrentUser(resp.data);
        this._loadingService.hide();
      }
    }, (error: any) => {
      this._loadingService.hide();
    })
  }

  cerrarSesion() {
    this._authService.logout();
  }

  ngOnInit() {
    this.cargarDatosUsuario();
  }
}


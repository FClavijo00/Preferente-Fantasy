import { Component, inject, Input, OnInit } from '@angular/core';
import {
  IonTitle,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  NavController,
  ModalController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, chevronBackOutline, informationCircleOutline, trophyOutline } from 'ionicons/icons';
import { LigasService } from '../../../core/services/ligas.service';
import { InfoPuntuacionComponent } from '../../modals/info-puntuacion/info-puntuacion.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [
    IonIcon,
    IonButton,
    IonButtons,
    IonToolbar,
    IonHeader],
})
export class HeaderComponent {
  @Input() titulo: string = '';

  private _navCtrl = inject(NavController);
  private _ligasService = inject(LigasService);
  private _modalCtrl = inject(ModalController);

  constructor() {
    addIcons({
      arrowBackOutline,
      trophyOutline,
      chevronBackOutline,
      informationCircleOutline
    });
  }

  abrirInformacionPuntuacion() {
    const modal = this._modalCtrl.create({
      component: InfoPuntuacionComponent,
      cssClass: 'card-modal-center',
      backdropDismiss: true,
    });
    modal.then((modal) => {
      modal.present();
    })
  }

  backRecepcion() {
    this._ligasService.clearLigaSeleccionada();
    this._navCtrl.navigateBack(['recepcion']);
  }
}

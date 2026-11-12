import { Component, inject, Input, OnInit } from '@angular/core';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { NavController } from '@ionic/angular/nav-controller';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { arrowBackOutline, chevronBackOutline, informationCircleOutline, trophyOutline } from 'ionicons/icons';
import { Ligas, LigasService } from '../../../core/services/ligas.service';
import { InfoPuntuacionComponent } from '../../modals/info-puntuacion/info-puntuacion.component';

interface Liga {
  id: number;
  nombre: string;
  codigo_acceso: string | null;
  nombre_competicion: string;
  privada: boolean;
  total_participantes: number;
}


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

  public liga: Ligas | null = this._ligasService.ligaSeleccionada();

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

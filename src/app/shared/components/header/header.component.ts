import { Component, inject, Input, OnInit } from '@angular/core';
import {
  IonTitle,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  NavController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, chevronBackOutline, trophyOutline } from 'ionicons/icons';
import { LigasService } from '../../../core/services/ligas.service';

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

  constructor() {
    addIcons({
      arrowBackOutline,
      trophyOutline,
      chevronBackOutline
    });
  }

  backRecepcion() {
    this._ligasService.clearLigaSeleccionada();
    this._navCtrl.navigateBack(['recepcion']);
  }
}

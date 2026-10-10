import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-terminos-servicio',
  templateUrl: './terminos-servicio.page.html',
  styleUrls: ['./terminos-servicio.page.scss'],
  imports: [IonIcon, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class TerminosServicioPage {

  private _navCtrl = inject(NavController);

  constructor() {
    addIcons({ arrowBackOutline });
  }

  volver() {
    this._navCtrl.navigateBack('/landing-page');
  }

}

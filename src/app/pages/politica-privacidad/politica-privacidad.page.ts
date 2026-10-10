import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonIcon,
  NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-politica-privacidad',
  templateUrl: './politica-privacidad.page.html',
  styleUrls: ['./politica-privacidad.page.scss'],
  imports: [
    IonIcon,
    IonButtons,
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
  ],
})
export class PoliticaPrivacidadPage {
  
  private _navCtrl = inject(NavController);

  constructor() {
    addIcons({ arrowBackOutline });
  }

  volver() {
    this._navCtrl.navigateBack('/landing-page');
  }
}

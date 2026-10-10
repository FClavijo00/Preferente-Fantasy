import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton, IonButtons, NavController, IonFooter} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, chevronDownOutline, chevronUpOutline, footballOutline, homeOutline, logoInstagram, peopleOutline, shirtOutline, statsChartOutline, trophyOutline } from 'ionicons/icons';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.page.html',
  styleUrls: ['./landing-page.page.scss'],
  imports: [IonButton, IonIcon, IonContent, IonHeader, IonToolbar, CommonModule, FormsModule]
})
export class LandingPagePage {

  private _navCtrl = inject(NavController);

  public mostrarInfo = signal<boolean>(false);

  constructor() {
    addIcons({
      footballOutline,
      peopleOutline,
      trophyOutline,
      statsChartOutline,
      checkmarkCircleOutline,
      logoInstagram,
      chevronUpOutline,
      chevronDownOutline,
      homeOutline,
      shirtOutline
    });
  }

  toggleInfo() {
    this.mostrarInfo.set(!this.mostrarInfo());
  }

  jugarAhora() {
    this._navCtrl.navigateRoot('/login', { replaceUrl: true });
  }

  abrirTerminos() {
    this._navCtrl.navigateForward('/terminos-servicio');
  }

  abrirPolitica() {
    this._navCtrl.navigateForward('/politica-privacidad');
  }

}

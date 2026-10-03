import { Component, OnInit } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonAvatar,
  IonCardSubtitle,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/angular';

@Component({
  selector: 'app-info-puntuacion',
  templateUrl: './info-puntuacion.component.html',
  styleUrls: ['./info-puntuacion.component.scss'],
  imports: [
    IonCardTitle,
    IonCardHeader,
    IonCardSubtitle,
    IonCardContent,
    IonCard
],
})
export class InfoPuntuacionComponent {
  constructor() {}
}

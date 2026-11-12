import { Component, OnInit } from '@angular/core';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonAvatar } from '@ionic/angular/ion-avatar';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';

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

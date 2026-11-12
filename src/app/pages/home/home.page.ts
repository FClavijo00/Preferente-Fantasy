import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ClasificacionComponent } from '../../shared/components/clasificacion/clasificacion.component';
import { CalendarioComponent } from '../../shared/components/calendario/calendario.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    HeaderComponent,
    ClasificacionComponent,
    CalendarioComponent
],
})
export class HomePage {

  constructor() {}
}

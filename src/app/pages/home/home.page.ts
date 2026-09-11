import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardSubtitle,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular';
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
export class HomePage implements OnInit {
  constructor() {}

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit() {}
}

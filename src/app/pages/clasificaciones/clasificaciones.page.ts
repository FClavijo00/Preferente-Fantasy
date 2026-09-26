import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-clasificaciones',
  templateUrl: './clasificaciones.page.html',
  styleUrls: ['./clasificaciones.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ClasificacionesPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}

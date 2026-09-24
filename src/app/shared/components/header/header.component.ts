import { Component, inject, Input, OnInit } from '@angular/core';
import {
  IonTitle,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  NavController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [
    IonIcon,
    IonButton,
    IonBackButton,
    IonButtons,
    IonToolbar,
    IonHeader,
  ],
})
export class HeaderComponent implements OnInit {
  @Input() titulo: string = '';

  private _navCtrl = inject(NavController);

  constructor() {
    addIcons({
      arrowBackOutline,
    });
  }

  backRecepcion() {
    this._navCtrl.navigateBack(['recepcion']);
  }

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit() {
    console.log(this.titulo);
  }
}

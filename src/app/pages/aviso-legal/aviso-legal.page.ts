import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-aviso-legal',
  templateUrl: './aviso-legal.page.html',
  styleUrls: ['./aviso-legal.page.scss'],
  imports: [RouterLink, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton],
})
export class AvisoLegalPage {
  readonly siteUrl = environment.siteUrl;
}

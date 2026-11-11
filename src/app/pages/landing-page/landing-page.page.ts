import { Component, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonIcon } from '@ionic/angular/ion-icon';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  checkmarkCircleOutline,
  chevronDownOutline,
  footballOutline,
  logoInstagram,
  peopleOutline,
  statsChartOutline,
  trophyOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.page.html',
  styleUrls: ['./landing-page.page.scss'],
  imports: [RouterLink, IonContent, IonHeader, IonToolbar, IonIcon],
})
export class LandingPagePage {
  private readonly _content = viewChild.required(IonContent);

  public readonly anioActual = new Date().getFullYear();

  constructor() {
    addIcons({
      calendarOutline,
      checkmarkCircleOutline,
      chevronDownOutline,
      footballOutline,
      logoInstagram,
      peopleOutline,
      statsChartOutline,
      trophyOutline,
    });
  }

  /**
   * Los enlaces "#ancla" no funcionan dentro de <ion-content> (el scroll vive
   * en su shadow DOM), así que desplazamos el contenido a mano.
   */
  async irASeccion(id: string): Promise<void> {
    const destino = document.getElementById(id);
    if (!destino) return;

    const scrollEl = await this._content().getScrollElement();
    const offset =
      destino.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop;

    await this._content().scrollToPoint(0, offset - 16, 500);
  }
}

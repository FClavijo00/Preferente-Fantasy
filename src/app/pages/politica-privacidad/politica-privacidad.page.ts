import { Component, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonBackButton } from '@ionic/angular/ion-back-button';

@Component({
  selector: 'app-politica-privacidad',
  templateUrl: './politica-privacidad.page.html',
  styleUrls: ['./politica-privacidad.page.scss'],
  imports: [RouterLink, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton],
})
export class PoliticaPrivacidadPage {
  private readonly _content = viewChild.required(IonContent);

  readonly indice = [
    { id: 'responsable', titulo: 'Responsable' },
    { id: 'datos', titulo: 'Qué datos tratamos' },
    { id: 'finalidades', titulo: 'Para qué y con qué base legal' },
    { id: 'futbolistas', titulo: 'Datos de futbolistas' },
    { id: 'conservacion', titulo: 'Cuánto tiempo los guardamos' },
    { id: 'destinatarios', titulo: 'Con quién los compartimos' },
    { id: 'cookies', titulo: 'Cookies y almacenamiento local' },
    { id: 'menores', titulo: 'Menores de edad' },
    { id: 'seguridad', titulo: 'Seguridad' },
    { id: 'derechos', titulo: 'Tus derechos' },
    { id: 'cambios', titulo: 'Cambios en esta política' },
  ];

  /** Los enlaces #ancla no funcionan dentro de ion-content: desplazamos a mano. */
  async irA(id: string): Promise<void> {
    const destino = document.getElementById(id);
    if (!destino) return;
    const scrollEl = await this._content().getScrollElement();
    const offset = destino.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop;
    await this._content().scrollToPoint(0, offset - 12, 400);
  }
}

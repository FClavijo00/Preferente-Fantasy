import { Component, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonBackButton } from '@ionic/angular/ion-back-button';

@Component({
  selector: 'app-terminos-servicio',
  templateUrl: './terminos-servicio.page.html',
  styleUrls: ['./terminos-servicio.page.scss'],
  imports: [RouterLink, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton],
})
export class TerminosServicioPage {
  private readonly _content = viewChild.required(IonContent);

  readonly indice = [
    { id: 'titular', titulo: 'Titular y contacto' },
    { id: 'aceptacion', titulo: 'Aceptación' },
    { id: 'servicio', titulo: 'Qué es Preferente Fantasy' },
    { id: 'cuenta', titulo: 'Tu cuenta' },
    { id: 'puntuaciones', titulo: 'Puntuaciones y actas' },
    { id: 'ligas', titulo: 'Ligas privadas' },
    { id: 'conducta', titulo: 'Normas de conducta' },
    { id: 'contenido', titulo: 'Contenido que subes' },
    { id: 'propiedad', titulo: 'Propiedad intelectual y no afiliación' },
    { id: 'publicidad', titulo: 'Publicidad' },
    { id: 'responsabilidad', titulo: 'Disponibilidad y responsabilidad' },
    { id: 'baja', titulo: 'Suspensión y baja' },
    { id: 'cambios', titulo: 'Cambios en los términos' },
    { id: 'ley', titulo: 'Ley aplicable' },
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

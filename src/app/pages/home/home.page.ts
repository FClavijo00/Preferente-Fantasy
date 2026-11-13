import { Component, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IonContent } from '@ionic/angular/ion-content';
// import { IonIcon } from '@ionic/angular/ion-icon';
// import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { addIcons } from 'ionicons';
import { arrowForward, refreshOutline, trophy } from 'ionicons/icons';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { CompeticionComponent } from '../../shared/components/competicion/competicion.component';
import { LigasService } from '../../core/services/ligas.service';
import { ClasificacionesService, ResumenUltimaJornada } from '../../core/services/clasificaciones.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  // IonIcon e IonSkeletonText solo los usa el bloque de la liga (comentado en el HTML)
  imports: [IonContent, HeaderComponent, CompeticionComponent],
})
export class HomePage {
  /**
   * Bloque "Tu Liga · Última Jornada": desactivado por ahora (su HTML está comentado).
   * Mientras sea false no se pide el resumen al backend.
   */
  private readonly BLOQUE_LIGA_ACTIVO = false;

  private _ligasService = inject(LigasService);
  private _clasificacionesService = inject(ClasificacionesService);
  private _router = inject(Router);

  readonly liga = this._ligasService.ligaSeleccionada;

  readonly resumen = signal<ResumenUltimaJornada | null>(null);
  readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');

  constructor() {
    addIcons({ arrowForward, refreshOutline, trophy });

    // Al entrar en una liga (o cambiar de liga) se carga su resumen.
    // OJO: la carga va en untracked(); si no, las señales que lee cargarResumen() (resumen,
    // estado) pasan a ser dependencias del effect y cada respuesta lanzaba otra llamada (bucle).
    effect(() => {
      const ligaId = this.liga()?.id;
      if (ligaId && this.BLOQUE_LIGA_ACTIVO) untracked(() => this.cargarResumen(ligaId));
    });
  }

  /** Al volver a la pestaña de Inicio se refresca (por si se ha cerrado una jornada). */
  ionViewWillEnter() {
    const ligaId = this.liga()?.id;
    if (ligaId && this.BLOQUE_LIGA_ACTIVO && this.estado() !== 'cargando') this.cargarResumen(ligaId);
  }

  async cargarResumen(ligaId: number) {
    if (!this.resumen()) this.estado.set('cargando');
    try {
      const res = await firstValueFrom(this._clasificacionesService.getResumenUltimaJornada(ligaId));
      this.resumen.set(res.data);
      this.estado.set('listo');
    } catch {
      this.estado.set('error');
    }
  }

  reintentar() {
    const ligaId = this.liga()?.id;
    if (ligaId) this.cargarResumen(ligaId);
  }

  /** Lleva a Clasificación > Mi equipo en esa jornada. */
  verMiEquipo(jornadaId: number) {
    this._router.navigate(['/tabs/clasificaciones'], { queryParams: { vista: 'mi-equipo', jornada: jornadaId } });
  }
}

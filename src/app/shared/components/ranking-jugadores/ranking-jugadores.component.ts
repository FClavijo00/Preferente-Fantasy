import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { chevronDownOutline, refreshOutline } from 'ionicons/icons';
import { JugadoresService, JugadorRanking } from '../../../core/services/jugadores-service';
import { DetalleJugadorComponent } from '../../modals/detalle-jugador/detalle-jugador.component';
import { AvatarJugadorComponent } from '../avatar-jugador/avatar-jugador.component';

type FiltroPosicion = 'TODOS' | 'POR' | 'DEF' | 'MED' | 'DEL';

interface FilaRanking extends JugadorRanking {
  /** Puesto en el ranking general (empates comparten puesto) */
  puesto: number;
  media: number;
}

const POR_PAGINA = 15;

/**
 * Ranking de jugadores por puntos de fantasy (pestaña "Ranking" de la competición).
 * Filtro por posición, "Ver más" y detalle del jugador al pulsar una fila.
 */
@Component({
  selector: 'app-ranking-jugadores',
  templateUrl: './ranking-jugadores.component.html',
  styleUrls: ['./ranking-jugadores.component.scss'],
  imports: [IonIcon, IonSkeletonText, DecimalPipe, AvatarJugadorComponent],
})
export class RankingJugadoresComponent implements OnInit {
  private _jugadoresService = inject(JugadoresService);
  private _modalCtrl = inject(ModalController);

  readonly filtros: FiltroPosicion[] = ['TODOS', 'POR', 'DEF', 'MED', 'DEL'];
  readonly esqueletos = Array.from({ length: 6 });

  readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');
  private readonly filas = signal<FilaRanking[]>([]);
  readonly filtro = signal<FiltroPosicion>('TODOS');
  readonly visibles = signal(POR_PAGINA);

  readonly filtradas = computed(() => {
    const f = this.filtro();
    return f === 'TODOS' ? this.filas() : this.filas().filter((j) => j.posicion === f);
  });

  readonly mostradas = computed(() => this.filtradas().slice(0, this.visibles()));
  readonly restantes = computed(() => this.filtradas().length - this.mostradas().length);

  constructor() {
    addIcons({ chevronDownOutline, refreshOutline });
  }

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    this.estado.set('cargando');
    try {
      const datos = (await firstValueFrom(this._jugadoresService.getRanking())) ?? [];
      // Viene ordenado por puntos; el puesto es el del ranking general (con empates)
      let puesto = 0;
      this.filas.set(
        datos.map((j, i) => {
          if (i === 0 || j.puntos_totales_temporada !== datos[i - 1].puntos_totales_temporada) puesto = i + 1;
          return {
            ...j,
            puesto,
            media: j.jornadas_jugadas > 0 ? j.puntos_totales_temporada / j.jornadas_jugadas : 0,
          };
        }),
      );
      this.estado.set('listo');
    } catch {
      this.estado.set('error');
    }
  }

  filtrar(f: FiltroPosicion) {
    this.filtro.set(f);
    this.visibles.set(POR_PAGINA);
  }

  verMas() {
    this.visibles.update((n) => n + POR_PAGINA);
  }

  nombre(j: JugadorRanking): string {
    return j.apodo?.trim() || `${j.nombre} ${j.apellidos ?? ''}`.trim();
  }

  async abrirDetalle(j: JugadorRanking) {
    const modal = await this._modalCtrl.create({
      component: DetalleJugadorComponent,
      cssClass: 'card-modal-center',
      backdropDismiss: true,
      componentProps: { jugadorId: j.jugador_id },
    });
    await modal.present();
  }
}

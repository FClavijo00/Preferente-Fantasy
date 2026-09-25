import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSegmentView,
  IonSegmentContent,
  IonItem,
  IonList,
  IonAvatar,
  IonButton, IonIcon
} from '@ionic/angular';
import { EquiposService } from '../../../core/services/equipos-service';
import { JugadoresService } from '../../../core/services/jugadores-service';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

export interface Clasificacion {
  equipo_id: number;
  equipo: string;
  escudo_url: string;
  escudo: string;
  partidos_jugados: number;
  ganados: number;
  perdidos: number;
  empatados: number;
  goles_favor: number;
  goles_contra: number;
  diferencia_goles: number;
  puntos: number;
  san: number;
}

interface JugadorRanking {
  jugador_id: number;
  nombre: string;
  apellidos: string;
  apodo: string;
  posicion: string;
  foto_url: string;
  foto: string;
  nombre_equipo: string;
  partidos_jugados: number;
  partidos_titular: number;
  partidos_suplente: number;
  goles_favor: number;
  tarjetas_amarillas: number;
  tarjetas_rojas: number;
  goles_en_propia: number;
  goles_penalti: number;
  goles_encajados: number;
}

@Component({
  selector: 'app-clasificacion',
  templateUrl: './clasificacion.component.html',
  styleUrls: ['./clasificacion.component.scss'],
  imports: [IonIcon, IonButton, IonAvatar,
    IonList,
    IonItem,
    IonBadge,
    IonLabel,
    IonSegmentButton,
    IonSegment,
    IonCardContent,
    IonCardHeader,
    IonCard,
    IonSegmentView,
    IonSegmentContent
  ],
})
export class ClasificacionComponent implements OnInit {
  private _equiposService = inject(EquiposService);
  private _jugadoresService = inject(JugadoresService);

  public clasificacion = signal<Clasificacion[]>([]);
  public ranking = signal<JugadorRanking[]>([]);

  // Estado paginator
  paginaActual = signal<number>(1);
  elementoPorPagina = signal<number>(10);

  jugadoresPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.elementoPorPagina();
    const fin = inicio + this.elementoPorPagina();
    return this.ranking().slice(inicio, fin);
  });

  totalPaginas = computed(() => {
    return Math.ceil(this.ranking().length / this.elementoPorPagina()) || 1;
  });

  // Método para navegar entre páginas
  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas()) {
      this.paginaActual.set(nuevaPagina);
    }
  }

  constructor() {
    addIcons({
      chevronForwardOutline,
      chevronBackOutline
    })
  }

  async getClasificacion() {
    this._equiposService.getClasificacion().subscribe({
      next: (data: any) => {
        this.clasificacion.set(data);
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  async getRanking() {
    this._jugadoresService.getRanking().subscribe({
      next: (data: any) => {
        this.ranking.set(data);
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  segmentChanged(ev: any) {
    /* console.log('Segment changed', ev.detail.value); */
  }

  ngOnInit() {
    this.getClasificacion();
    this.getRanking();
  }
}

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { IonBadge } from '@ionic/angular/ion-badge';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonSegment } from '@ionic/angular/ion-segment';
import { IonSegmentButton } from '@ionic/angular/ion-segment-button';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonSegmentView } from '@ionic/angular/ion-segment-view';
import { IonSegmentContent } from '@ionic/angular/ion-segment-content';
import { IonItem } from '@ionic/angular/ion-item';
import { IonList } from '@ionic/angular/ion-list';
import { IonAvatar } from '@ionic/angular/ion-avatar';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { EquiposService } from '../../../core/services/equipos-service';
import { JugadoresService } from '../../../core/services/jugadores-service';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { DecimalPipe } from '@angular/common';

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
  apellidos: string;
  apodo: string;
  equipo: string;
  foto: string;
  foto_url: string;
  jornadas_jugadas: number;
  jugador_id: number;
  nombre: string;
  posicion: string;
  puntos_totales_temporada: number;
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
    IonSegmentContent,
    DecimalPipe
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

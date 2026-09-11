import { Component, inject, OnInit, signal } from '@angular/core';
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
} from '@ionic/angular';
import { EquiposService } from '../../../core/services/equipos-service';
import { JugadoresService } from '../../../core/services/jugadores-service';

export interface Clasificacion {
  id: number;
  nombre: string;
  escudo_url: string;
  escudo: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
  san: number;
}

interface JugadorRanking {
  id: number;
  nombre: string;
  apellidos: string;
  apodo: string;
  posicion: string;
  foto_url: string;
  foto: string;
  equipo: string;
  partidos_jugados: number;
  partidos_titular: number;
  partidos_suplente: number;
  goles: number;
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
  imports: [
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

  constructor() {}

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
    console.log('Segment changed', ev.detail.value);
  }

  ngOnInit() {
    this.getClasificacion();
    this.getRanking();
  }
}

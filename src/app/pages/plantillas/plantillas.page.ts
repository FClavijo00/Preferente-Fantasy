import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSpinner,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  ModalController,
} from '@ionic/angular';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { EquiposService } from '../../core/services/equipos-service';
import { DetalleJugadorComponent } from '../../shared/modals/detalle-jugador/detalle-jugador.component';

export interface Equipo {
  id: number;
  nombre: string;
  escudo: string;
  escudo_url: string;
  color_primario: string;
  color_secundario: string;
  competicion_id: number;
  jugadores: Jugador[];
}

export interface Jugador {
  id: number;
  nombre: string;
  apellidos: string;
  apodo: string;
  posicion: 'POR' | 'DEF' | 'MED' | 'DEL';
  precio: number;
  puntosTotales: number;
  fotoUrl?: string;
  foto?: string;
  lesionado: boolean;
  activo: boolean;
  puntos_totales: number;
  puntuaciones_jornada: PuntuacionesJornada[];
}

export interface PuntuacionesJornada {
  desglose: [];
  jornada_id: number;
  jornada: number;
  puntos: number;
}

@Component({
  selector: 'app-plantillas',
  templateUrl: './plantillas.page.html',
  styleUrls: ['./plantillas.page.scss'],
  imports: [
    IonSegmentButton,
    IonSegment,
    IonLabel,
    IonAvatar,
    IonItem,
    IonList,
    IonSpinner,
    IonContent,
    CommonModule,
    FormsModule,
    HeaderComponent,
  ],
})
export class PlantillasPage implements OnInit {
  private _equiposService = inject(EquiposService);
  private _modalCtrl = inject(ModalController);

  equipos = signal<Equipo[]>([]);
  equipoSeleccionado = signal<Equipo | null>(null);
  loadingEquipos = signal<boolean>(true);
  jugadores = signal<Jugador[]>([]);
  jugadoresFiltrados = signal<Jugador[]>([]);
  loadingJugadores = signal<boolean>(false);
  posicionFiltro = signal<string>('TODOS');

  constructor() {}

  async cargarEquipos() {
    this.loadingEquipos.set(true);
    this._equiposService.getEquipos().subscribe({
      next: (data: any) => {
        this.equipos.set(data);
        if (data.length > 0) {
          this.seleccionarEquipo(data[0]);
        }
        this.loadingEquipos.set(false);
      },
      error: (error) => {
        console.log(error);
        this.loadingEquipos.set(false);
      },
    });
  }

  filtrarPosicion(event: any) {
    const posicion = event.detail.value.toUpperCase();
    this.posicionFiltro.set(posicion);

    if (posicion === 'TODOS') {
      this.jugadoresFiltrados.set(this.jugadores());
    } else {
      const filtrados = this.jugadores().filter(
        (jugador) => jugador.posicion === posicion,
      );
      this.jugadoresFiltrados.set(filtrados);
    }
  }

  seleccionarEquipo(equipo: Equipo) {
    this.equipoSeleccionado.set(equipo);

    const listaCompleta = equipo.jugadores || [];

    this.jugadores.set(listaCompleta);

    if (this.posicionFiltro() === 'TODOS') {
      this.jugadoresFiltrados.set(listaCompleta);
    } else {
      this.jugadoresFiltrados.set(
        listaCompleta.filter(
          (j: Jugador) => j.posicion === this.posicionFiltro(),
        ),
      );
    }
  }

  async verDetalleJugador(jugador: Jugador) {
    const modal = await this._modalCtrl.create({
      component: DetalleJugadorComponent,
      cssClass: 'card-modal-center', // Clase CSS para estilizar el modal
      backdropDismiss: true,
      componentProps: {
        jugador: jugador
      },
    });

    await modal.present();
  }

  ngOnInit() {
    this.cargarEquipos();
  }
}

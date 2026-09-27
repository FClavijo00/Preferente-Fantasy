import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import {
  IonHeader,
  IonAvatar,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonTitle,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, close } from 'ionicons/icons';

export interface JugadorMercado {
  id: number;
  apodo: string;
  equipo_escudo: string;
  equipo_id: number;
  equipo_nombre: string;
  foto: string;
  nombre: string;
  posicion: string;
  puntos_totales: number;
}

@Component({
  selector: 'app-select-jugadores',
  templateUrl: './select-jugadores.component.html',
  styleUrls: ['./select-jugadores.component.scss'],
  imports: [
    IonTitle,
    IonContent,
    IonIcon,
    IonButton,
    IonButtons,
    IonToolbar,
    IonAvatar,
    IonHeader,
  ],
})
export class SelectJugadoresComponent implements OnInit {
  @Input() posicion!: 'POR' | 'DEF' | 'MED' | 'DEL';
  @Input() alineacionActual: any[] = [];
  @Input() listaJugadores: JugadorMercado[] = [];
  @Input() listaEquipos: Array<{ id: number; nombre: string; escudo: string }> = [];

  private _modalCtrl = inject(ModalController);

  // ID de equipo seleccionado (null = Federación/Todos)
  equipoFiltro = signal<number | null>(null);

  // Lista base interna (limpia de jugadores ya alineados)
  private _listaDisponibles: JugadorMercado[] = [];

  // Señal con los jugadores a mostrar en la vista
  jugadoresFiltrados = signal<JugadorMercado[]>([]);

  // Mapa para controlar el límite de 3 por equipo
  conteoPorEquipo = computed(() => {
    const mapa = new Map<number, number>();
    this.alineacionActual.forEach((slot) => {
      if (slot.jugador?.equipo_id) {
        const count = mapa.get(slot.jugador.equipo_id) || 0;
        mapa.set(slot.jugador.equipo_id, count + 1);
      }
    });
    return mapa;
  });

  constructor() {
    addIcons({ add, close });
  }

  ngOnInit() {
    // 1. Filtramos los jugadores que ya están puestos en la alineación actual
    this.eliminarJugadoresYaAlineados();

    // 2. Aplicamos el filtro inicial por defecto (Todos)
    this.filtrarPorEquipo(null);
  }eliminarJugadoresYaAlineados() {
    // Extraemos los IDs de los jugadores actualmente en el 11
    const idsAlineados = new Set(
      this.alineacionActual
        .map((slot) => slot.jugador?.id)
        .filter((id): id is number => id !== null && id !== undefined)
    );

    // Guardamos la lista excluyendo los alineados
    this._listaDisponibles = (this.listaJugadores || []).filter(
      (jugador) => !idsAlineados.has(jugador.id)
    );
  }

  filtrarPorEquipo(equipoId: number | null) {
    this.equipoFiltro.set(equipoId);

    if (equipoId === null) {
      this.jugadoresFiltrados.set(this._listaDisponibles);
    } else {
      this.jugadoresFiltrados.set(
        this._listaDisponibles.filter((j) => j.equipo_id === equipoId)
      );
    }
  }

  esEquipoBloqueado(equipoId: number): boolean {
    return (this.conteoPorEquipo().get(equipoId) || 0) >= 3;
  }

  seleccionarJugador(jugador: JugadorMercado) {
    if (this.esEquipoBloqueado(jugador.equipo_id)) {
      return; // Bloqueado si el club ya tiene 3 elegidos
    }
    this._modalCtrl.dismiss(jugador, 'confirm');
  }

  cerrarModal() {
    this._modalCtrl.dismiss(null, 'cancel');
  }
}

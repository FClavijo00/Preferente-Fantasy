import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonAvatar, ModalController } from "@ionic/angular";
import { addIcons } from 'ionicons';
import { close, trash } from 'ionicons/icons';
import { LoadingService } from '../../../core/services/loading.service';
import { JugadoresService } from '../../../core/services/jugadores-service';

interface JugadorSlot {
  index: number;
  rol: 'POR' | 'DEF' | 'MED' | 'DEL';
  jugador: Jugador | null;
  escudo: string | null;
  puntos?: number
}

interface Jugador {
  id: number;
  apodo: string;
  equipo_escudo: string;
  equipo_escudo_url: string;
  equipo_id: number;
  equipo_nombre: string;
  foto: string;
  foto_url: string;
  nombre: string;
  posicion: string;
  puntos_jornada: number;
}

@Component({
  selector: 'app-select-jugadores-once-ideal',
  templateUrl: './select-jugadores-once-ideal.component.html',
  styleUrls: ['./select-jugadores-once-ideal.component.scss'],
  imports: [IonAvatar, IonIcon, IonButton, IonButtons, IonTitle, IonToolbar, IonHeader,],
})
export class SelectJugadoresOnceIdealComponent implements OnInit {

  @Input() posicion!: 'POR' | 'DEF' | 'MED' | 'DEL';
  @Input() jornada!: any
  @Input() alineacionActual: JugadorSlot[] = [];
  
  private _modalCtrl = inject(ModalController);
  private _loadingService = inject(LoadingService);
  private _jugadoresService = inject(JugadoresService);

  jugadores = signal<Jugador[]>([]);
  jugadoresFiltrados = signal<Jugador[]>([]);

  private _listaDisponibles: Jugador[] = [];

  constructor() {
    addIcons({
      trash,
      close
    })
  }

  cargarJugadores() {
    this._loadingService.show();
    let data = {
      jornada_id : this.jornada.id,
      posicion: this.posicion
    }
    this._jugadoresService.getJugadoresPorJornada(data).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.jugadores.set(resp.data || []);
          this.jugadoresFiltrados.set(resp.data || []);
          this.eliminarYaAlineados();
          this._loadingService.hide();
        }
      },
      error: (err: any) => {
        console.error('Error al cargar jornadas:', err);
        this._loadingService.hide();
      },
    })
  }

  cerrarModal() {
    this._modalCtrl.dismiss();
  }

  eliminarYaAlineados() {
    const idsAlineados = new Set(
      this.alineacionActual
      .map((slot) => slot.jugador?.id)
      .filter((id): id is number => id !== null && id !== undefined)
    );

    this._listaDisponibles =
      this.jugadores()
      .filter((jugador) => !idsAlineados.has(jugador.id));

    this.jugadoresFiltrados.set(this._listaDisponibles);
  }

  seleccionarJugador(jugador: any) {
    this._modalCtrl.dismiss(jugador, 'confirm');
  }

  vaciarHueco() {
    this._modalCtrl.dismiss(null, 'confirm');
  }

  ngOnInit() {
    this.cargarJugadores();
  }

}

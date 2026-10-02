import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AlineacionesService } from '../../../core/services/alineaciones.service';
import { AuthService } from '../../../core/services/auth-service.service';
import { ClasificacionesService } from '../../../core/services/clasificaciones.service';
import { LigasService } from '../../../core/services/ligas.service';
import { LoadingService } from '../../../core/services/loading.service';
import { IonIcon } from '@ionic/angular';
import { DetalleJugadorJornadaComponent } from '../../modals/detalle-jugador-jornada/detalle-jugador-jornada.component';
import { JornadasService } from '../../../core/services/jornadas-service';
import { NgTemplateOutlet } from '@angular/common';

interface JugadorSlot {
  index: number;
  rol: 'POR' | 'DEF' | 'MED' | 'DEL';
  jugador: any | null;
  escudo: string | null;
  puntos?: number;
}

@Component({
  selector: 'app-plantilla-clasificacion',
  templateUrl: './plantilla-clasificacion.component.html',
  styleUrls: ['./plantilla-clasificacion.component.scss'],
  imports: [IonIcon, NgTemplateOutlet],
})
export class PlantillaClasificacionComponent {
  @Input({ required: true }) set user(user: any) {
    if (user) {
      this._usuario = user;
      this.comprobarIniciar();
    }
  }
  get user() {
    return this._usuario;
  }

  @Input({ required: true }) set liga(liga: any) {
    if (liga) {
      this._liga = liga;
      this.comprobarIniciar();
    }
  }
  get liga() {
    return this._liga;
  }

  @Input() miEquipo: boolean = false;

  private _usuario: any;
  private _liga: any;

  private _loadingService = inject(LoadingService);
  private _modalCtrl = inject(ModalController);
  private _ligasService = inject(LigasService);
  private _authService = inject(AuthService);
  private _alineacionesService = inject(AlineacionesService);
  private _clasificacionesService = inject(ClasificacionesService);
  private _jornadasService = inject(JornadasService);

  //public liga = this._ligasService.ligaSeleccionada();

  jornadaSeleccionadaId = signal<number | null>(null);
  jornadasDisponibles = signal<any[]>([]);

  slots = signal<JugadorSlot[]>([]);
  delanteros = computed(() => this.slots().filter((s) => s.rol === 'DEL'));
  medios = computed(() => this.slots().filter((s) => s.rol === 'MED'));
  defensas = computed(() => this.slots().filter((s) => s.rol === 'DEF'));
  portero = computed(() => this.slots().filter((s) => s.rol === 'POR'));

  constructor() {}

  private comprobarIniciar() {
    if (this._usuario && this._liga) {
      this.getPuntuacionesJornadas();
    }
  }

  async abrirDetalleJugador(jugador: any) {
    const jornadaActual = this.jornadasDisponibles().find(
      (j) => j.jornada_id === this.jornadaSeleccionadaId(),
    );

    const jornadaCerrada = jornadaActual && jornadaActual.estado === 'CERRADA';

    if (jornadaCerrada) {
      const modal = await this._modalCtrl.create({
        component: DetalleJugadorJornadaComponent,
        cssClass: 'card-modal-center', // Clase CSS para estilizar el modal
        backdropDismiss: true,
        componentProps: {
          jugador: jugador.jugador,
          jornada: jornadaActual.numero_jornada,
        },
      });

      await modal.present();
    } else {
      return;
    }
  }

  seleccionarJornada(jornada: any) {
    this.jornadaSeleccionadaId.set(jornada.jornada_id);
    this.cargarAlineacionJornada();
  }

  private reconstuirSlots(formacion: any, jugadores: any[] = []) {
    const partes = formacion.split('-').map(Number);
    const distribucion = [
      { rol: 'DEL' as const, cantidad: partes[2] },
      { rol: 'MED' as const, cantidad: partes[1] },
      { rol: 'DEF' as const, cantidad: partes[0] },
      { rol: 'POR' as const, cantidad: 1 },
    ];

    let idx = 0;
    const slotsPrevios = this.slots();
    const nuevosSlots: JugadorSlot[] = [];

    distribucion.forEach((grupo) => {
      for (let i = 0; i < grupo.cantidad; i++) {
        // Mantiene el jugador si ya existía en el índice correspondiente
        const jugadorPrevio = slotsPrevios[idx]?.jugador || null;
        nuevosSlots.push({
          index: idx,
          rol: grupo.rol,
          jugador: jugadorPrevio,
          escudo: jugadorPrevio?.equipo_escudo || null,
          puntos: 0,
        });
        idx++;
      }
    });

    this.slots.set(nuevosSlots);

    if (jugadores && jugadores.length > 0) {
      this.slots.update((slots) => {
        const copy = [...slots];
        jugadores.forEach((jugador: any) => {
          const slotIdx = copy.findIndex(
            (s) => s.index === jugador.hueco_index,
          );
          if (slotIdx !== -1) {
            copy[slotIdx].jugador = {
              id: jugador.id || jugador.jugador_id,
              nombre: jugador.nombre,
              apellidos: jugador.apellidos,
              apodo: jugador.apodo,
              foto: jugador.foto,
              equipo_id: jugador.equipo_id,
              equipo_nombre: jugador.equipo_nombre,
              equipo_escudo: jugador.equipo_escudo,
              posicion: jugador.posicion,
              puntos_jornada: jugador.puntos_jornada,
              desglose: jugador.desglose_puntos,
            };
          }
        });
        return copy;
      });
    }
  }

  getPuntuacionesJornadas() {
    this._loadingService.show();
    let data = {
      liga_id: this.liga?.id,
      usuario_id : this.user.id || this.user.usuario_id
    }
    this._jornadasService.getPuntuacionesJornadas(data).subscribe({
      next: (res: any) => {
        if (res.ok) {
          this.jornadasDisponibles.set(res.data || []);
          if (res.data.length > 0) {
            this.jornadaSeleccionadaId.set(res.data[0].jornada_id);
            this.cargarAlineacionJornada();
          }
          this._loadingService.hide();
        }
      }, error: (error: any) => {
        this._loadingService.hide();
      }
    })
  }

  async cargarAlineacionJornada() {
    this._loadingService.show();
    let data = {
      liga_id: this.liga?.id,
      jornada_id: this.jornadaSeleccionadaId(),
      usuario_id : this.user.usuario_id || this.user.id
    }
    this._alineacionesService.cargarAlineacionesJornadas(data).subscribe({
      next: (res: any) => {
        if (res.ok) {
          this.reconstuirSlots(res.data[0].formacion, res.data[0].jugadores);
          this._loadingService.hide();
        }
      }, error: (error: any) => {
        this._loadingService.hide();
      }
    })
  }
}

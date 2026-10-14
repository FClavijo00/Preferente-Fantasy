import {
  Component,
  computed,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import {
  IonTitle,
  IonHeader,
  IonToolbar,
  IonContent,
  IonLabel,
  IonButton,
  IonIcon,
  ModalController,
  IonItem,
  IonList,
  IonPopover,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { NgTemplateOutlet } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';
import { AlineacionesService } from '../../../core/services/alineaciones.service';
import { DetalleJugadorJornadaComponent } from '../detalle-jugador-jornada/detalle-jugador-jornada.component';

interface JugadorSlot {
  index: number;
  rol: 'POR' | 'DEF' | 'MED' | 'DEL';
  jugador: any | null;
  escudo: string | null;
  puntos?: number;
}

@Component({
  selector: 'app-once-ideal',
  templateUrl: './once-ideal.component.html',
  styleUrls: ['./once-ideal.component.scss'],
  imports: [
    IonPopover,
    IonList,
    IonItem,
    IonIcon,
    IonButton,
    IonContent,
    IonHeader,
    NgTemplateOutlet,
  ],
})
export class OnceIdealComponent implements OnInit {
  @Input() jornada: any;

  private _modalCtrl = inject(ModalController);
  private _loadingService = inject(LoadingService);
  private _alineacionesService = inject(AlineacionesService);

  slots = signal<JugadorSlot[]>([]);
  delanteros = computed(() => this.slots().filter((s) => s.rol === 'DEL'));
  medios = computed(() => this.slots().filter((s) => s.rol === 'MED'));
  defensas = computed(() => this.slots().filter((s) => s.rol === 'DEF'));
  portero = computed(() => this.slots().filter((s) => s.rol === 'POR'));


  constructor() {
    addIcons({ closeOutline });
  }

  async abrirDetalleJugador(jugador: JugadorSlot) {
    const modal = await this._modalCtrl.create({
      component: DetalleJugadorJornadaComponent,
      cssClass: 'card-modal-center', // Clase CSS para estilizar el modal
      backdropDismiss: true,
      componentProps: {
        jugador: jugador.jugador,
        jornada: this.jornada.numero_jornada,
      },
    });

    await modal.present();
  }

  async cargarOnceIdealJornada() {
    this._loadingService.show();

    this._alineacionesService.cargarOnceIdeal(this.jornada.jornada_id).subscribe({
      next: (res: any) => {
        if (res.existe) {
          this.reconstruirSlots(res.once_ideal_info.formacion, res.jugadores);
          this._loadingService.hide();
        } else {
          this.slots.set([]);
          this._loadingService.hide();
        }
      },
      error: (error: any) => {
        this._loadingService.hide();
      },
    })
  }

  cerrarModal() {
    this._modalCtrl.dismiss();
  }

  private reconstruirSlots(formacion: any, jugadores: any[] = []) {
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
              desglose: jugador.desglose_json,
            };
          }
        });
        return copy;
      });
    }
  }

  ngOnInit() {
    if (this.jornada) {
      this.cargarOnceIdealJornada();
    }
  }
}

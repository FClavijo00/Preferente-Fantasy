import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonIcon,
  IonSelect,
  IonSelectOption,
  ModalController,
  IonButton,
} from '@ionic/angular';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { LoadingService } from '../../core/services/loading.service';
import { JornadasService } from '../../core/services/jornadas-service';
import { addIcons } from 'ionicons';
import { add, warning } from 'ionicons/icons';
import { JugadoresService } from '../../core/services/jugadores-service';
import { SelectJugadoresComponent } from '../../shared/modals/select-jugadores/select-jugadores.component';
import { EquiposService } from '../../core/services/equipos-service';

export interface JugadorSlot {
  index: number;
  rol: 'POR' | 'DEF' | 'MED' | 'DEL';
  jugador: any | null; // Nulo significa hueco vacío
}

@Component({
  selector: 'app-alineacion',
  templateUrl: './alineacion.page.html',
  styleUrls: ['./alineacion.page.scss'],
  imports: [
    IonButton,
    IonIcon,
    IonContent,
    CommonModule,
    FormsModule,
    HeaderComponent,
    IonSelect,
    IonSelectOption,
    DatePipe,
  ],
})
export class AlineacionPage implements OnInit {
  
  private _loadingService = inject(LoadingService);
  private _jornadasService = inject(JornadasService);
  private _jugadoresService = inject(JugadoresService);
  private _modalCtrl = inject(ModalController);
  private _equiposService = inject(EquiposService);

  formaciones = ['4-4-2', '4-3-3', '5-3-2', '3-4-3', '3-5-2', '4-5-1', '5-4-1'];
  formacionSeleccionada = signal<string>('4-4-2');

  // Información de la jornada a la que se aplica la alineación
  jornadaObjetivo = signal<any | null>(null);

  // Lista plana de los 11 slots
  slots = signal<JugadorSlot[]>([]);
  // Agrupamos los slots según el rol para pintarlos por filas en la plantilla
  delanteros = computed(() => this.slots().filter((s) => s.rol === 'DEL'));
  medios = computed(() => this.slots().filter((s) => s.rol === 'MED'));
  defensas = computed(() => this.slots().filter((s) => s.rol === 'DEF'));
  portero = computed(() => this.slots().filter((s) => s.rol === 'POR'));

  equipos = signal<any[]>([]);

  constructor() {
    addIcons({
      add,
      warning
    });
  }

  // Contador de jugadores por equipo en la alineación actual
  conteoEquipos = computed(() => {
    const mapa = new Map<number, number>();
    this.slots().forEach((s) => {
      if (s.jugador?.equipo_id) {
        const count = mapa.get(s.jugador.equipo_id) || 0;
        mapa.set(s.jugador.equipo_id, count + 1);
      }
    });
    return mapa;
  });

  cargarProximaJornada() {
    this._loadingService.show();
    this._jornadasService.getSiguienteJornada().subscribe((data) => {
      this.jornadaObjetivo.set(data);
      this._loadingService.hide();
    });

    this.reconstruirSlots('4-4-2');
  }

  cambiarFormacion(event: any) {
    const nuevaFormacion = event.detail.value;
    this.formacionSeleccionada.set(nuevaFormacion);
    this.reconstruirSlots(nuevaFormacion);
  }

  private reconstruirSlots(formacion: string) {
    const partes = formacion.split('-').map(Number);
    const distribucion = [
      { rol: 'DEL' as const, cantidad: partes[2] },
      { rol: 'MED' as const, cantidad: partes[1] },
      { rol: 'DEF' as const, cantidad: partes[0] },
      { rol: 'POR' as const, cantidad: 1 },
    ];

    let idx = 0;
    const nuevosSlots: JugadorSlot[] = [];

    distribucion.forEach((grupo) => {
      for (let i = 0; i < grupo.cantidad; i++) {
        // Mantiene el jugador previo si encaja en el mismo índice, o lo deja nulo
        const jugadorPrevio = this.slots()[idx]?.jugador || null;
        nuevosSlots.push({
          index: idx,
          rol: grupo.rol,
          jugador: jugadorPrevio,
        });
        idx++;
      }
    });

    this.slots.set(nuevosSlots);
  }

  // Validación clave: Máximo 3 por equipo
  validarSeleccionJugador(nuevoJugador: any): {
    valido: boolean;
    mensaje?: string;
  } {
    const conteoActual = this.conteoEquipos().get(nuevoJugador.equipo_id) || 0;

    if (conteoActual >= 3) {
      return {
        valido: false,
        mensaje: `Ya tienes 3 jugadores de ${nuevoJugador.equipo_nombre} en tu 11.`,
      };
    }

    return { valido: true };
  }

  async abrirSelectorJugador(slot: JugadorSlot) {
    const idsSeleccionados = this.slots()
      .map((s) => s.jugador?.id)
      .filter((id): id is number => id !== undefined && id !== null);

    this._jugadoresService.getJugadores(slot.rol, idsSeleccionados).subscribe({
      next: async (resp: any) => {
        const modal = await this._modalCtrl.create({
          component: SelectJugadoresComponent,
          cssClass: 'card-modal-center', // Clase CSS para estilizar el modal
          backdropDismiss: true,
          componentProps: {
            posicion: slot.rol,
            listaJugadores: resp.data,
            alineacionActual: this.slots(),
            listaEquipos: this.equipos(),
          },
        });

        await modal.present();

        // 4. Recibimos la selección del usuario
        const { data: jugadorElegido } = await modal.onDidDismiss();

        if (jugadorElegido) {
          this.asignarJugadorASlot(slot.index, jugadorElegido);
        }
      },
      error: (err: any) => console.error('Error al cargar futbolistas:', err),
    });
  }

  asignarJugadorASlot(index: number, jugador: any) {
    this.slots.update((lista) => {
      const copy = [...lista];
      copy[index].jugador = jugador;
      return copy;
    });
  }

  async seleccionarJugadorParaSlot(slotIndex: number, nuevoJugador: any) {
    const validacion = this.validarSeleccionJugador(nuevoJugador);

    if (!validacion.valido) {
      // Mostrar toast / alerta en Ionic
      console.warn(validacion.mensaje);
      return;
    }

    // Asignar jugador al slot correspondiente
    this.slots.update((lista) => {
      const copy = [...lista];
      copy[slotIndex].jugador = nuevoJugador;
      return copy;
    });
  }

  getEquipos() {
    this._equiposService.getEquiposLimpios().subscribe({
      next: (resp: any) => {
        this.equipos.set(resp.data);
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  guardarAlineacion() {
    console.log(this.slots());
  }

  ngOnInit() {
    this.getEquipos();
    this.cargarProximaJornada();
  }
}

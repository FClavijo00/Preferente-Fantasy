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
  IonSelect,
  IonSelectOption,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, closeOutline, warning } from 'ionicons/icons';
import { NgTemplateOutlet } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';
import { AlineacionesService } from '../../../core/services/alineaciones.service';
import { DetalleJugadorJornadaComponent } from '../detalle-jugador-jornada/detalle-jugador-jornada.component';
import { JornadasService } from '../../../core/services/jornadas-service';
import { FormacionesService } from '../../../core/services/formaciones.service';
import { SelectJugadoresOnceIdealComponent } from '../select-jugadores-once-ideal/select-jugadores-once-ideal.component';
import { ToastService } from '../../../core/services/toast.service';

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
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonContent,
    IonHeader,
    NgTemplateOutlet,
    IonSelect,
    IonSelectOption,
  ],
})
export class OnceIdealComponent implements OnInit {
  @Input() jornada: any;
  @Input() jornadasConOnceIdeal: any;

  private _modalCtrl = inject(ModalController);
  private _loadingService = inject(LoadingService);
  private _alineacionesService = inject(AlineacionesService);
  private _jornadasService = inject(JornadasService);
  private _formacionesService = inject(FormacionesService);
  private _toastService = inject(ToastService);

  slots = signal<JugadorSlot[]>([]);
  delanteros = computed(() => this.slots().filter((s) => s.rol === 'DEL'));
  medios = computed(() => this.slots().filter((s) => s.rol === 'MED'));
  defensas = computed(() => this.slots().filter((s) => s.rol === 'DEF'));
  portero = computed(() => this.slots().filter((s) => s.rol === 'POR'));

  jornadasDisputadas = signal<any[]>([]);
  formaciones = signal<any[]>([]);
  jornadaSeleccionada = signal<any>(null);
  formacionSeleccionada = signal<any>(null);

  jornadasDisponibles = computed(() => {
    const conOnce = this.jornadasConOnceIdeal;
    const todas = this.jornadasDisputadas();

    // Si no hay elementos que eliminar, devolvemos todas
    if (!conOnce || conOnce.length === 0) return todas;

    // Creamos un Set con los IDs de las jornadas que tienen once ideal para una búsqueda ultra rápida (O(1))
    const idsExcluir = new Set(conOnce.map((jornada: { id: number; }) => jornada.id));

    // Filtramos la lista completa descartando las que coincidan por ID
    return todas.filter(jornada => !idsExcluir.has(jornada.id));
  });

  constructor() {
    addIcons({ closeOutline, warning, checkmarkCircleOutline });
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

  async abrirSelectJugador(slot: JugadorSlot) {
    const modal = await this._modalCtrl.create({
      component: SelectJugadoresOnceIdealComponent,
      cssClass: 'card-modal-center', // Clase CSS para estilizar el modal
      backdropDismiss: true,
      componentProps: {
        posicion: slot.rol,
        jornada: this.jornadaSeleccionada(),
        alineacionActual: this.slots()
      },
    });

    await modal.present();

    const { data: jugadorElegido, role } = await modal.onDidDismiss();

    if (jugadorElegido !== null && role === 'confirm') {
      this.asignarJugadorASlot(slot.index, jugadorElegido);
    } else if (jugadorElegido === null && role === 'confirm') {
      this.asignarJugadorASlot(slot.index, null);
    }
  }

  private asignarJugadorASlot(index: number, jugador: any) {
    this.slots.update((lista) => {
      const copy = [...lista];
      copy[index].jugador = jugador;
      return copy;
    });
  }

  async cargarOnceIdealJornada() {
    this._loadingService.show();

    this._alineacionesService
      .cargarOnceIdeal(this.jornada.jornada_id)
      .subscribe({
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
      });
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

  private cargarNuevoOnceIdeal() {
    this._loadingService.show();
    this.cargarJornadas();
    this.cargarFormaciones();
  }

  cargarJornadas() {
    this._jornadasService.getJornadasDisputadas().subscribe({
      next: async (resp: any) => {
        if (resp.ok) {
          this.jornadasDisputadas.set(resp.data || []);
        }
      },
      error: (err: any) => {
        this.jornadasDisputadas.set([]);
        console.error('Error al cargar jornadas:', err);
      },
    });
  }

  cargarFormaciones() {
    this._formacionesService.getFormaciones().subscribe({
      next: async (resp: any) => {
        if (resp.ok) {
          this.formaciones.set(resp.data || []);
          this._loadingService.hide();
        }
      },
      error: (err: any) => {
        this._loadingService.hide();
        this.formaciones.set([]);
        console.error('Error al cargar formaciones:', err);
      },
    });
  }

  cambiarJornada(event: any) {
    this.jornadasDisponibles().forEach((jornada) => {
      if (jornada.id === Number(event.detail.value)) {
        this.jornadaSeleccionada.set(jornada);
      }
    })
  }

  cambiarFormacion(event: any) {
    this.formaciones().forEach((formacion) => {
      if (formacion.id === Number(event.detail.value)) {
        this.formacionSeleccionada.set(formacion);
      }
    })
    this.reconstruirSlots(this.formacionSeleccionada().formacion);
  }

  guardarOnceIdeal() {
    this._loadingService.show();
    const jugadoresOnceIdeal = this.slots()
    .filter((slot) => slot.jugador !== null)
    .map((slot) => ({
      jugador_id: slot.jugador.id,
      hueco_index: slot.index
    }));

    if (jugadoresOnceIdeal.length !== 11) {
      this._loadingService.hide();
      this._toastService.showErrorToast(
        'Debes completar los 11 jugadores de la alineación.',
      );
      return;
    }

    const payload = {
      jornada_id: this.jornadaSeleccionada().id,
      formacion_id: this.formacionSeleccionada().id,
      jugadores: jugadoresOnceIdeal
    };
    
    this._alineacionesService.guardarOnceIdeal(payload).subscribe({
      next: async (resp: any) => {
        if (resp.ok) {
          this._loadingService.hide();
          this._toastService.showSuccessToast(resp.message);
        }
      }, 
      error: (err: any) => {
        this._loadingService.hide();
        console.error('Error al guardar once ideal:', err);
      }
    })
  }

  ngOnInit() {
    if (this.jornada) {
      this.cargarOnceIdealJornada();
    } else {
      this.cargarNuevoOnceIdeal();
    }
  }
}

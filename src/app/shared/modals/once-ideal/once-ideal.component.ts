import {
  Component,
  computed,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonContent } from '@ionic/angular/ion-content';
import { IonIcon } from '@ionic/angular/ion-icon';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { add, checkmarkCircleOutline, closeOutline, warning } from 'ionicons/icons';
import { AvatarJugadorComponent } from '../../components/avatar-jugador/avatar-jugador.component';
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
  imports: [IonIcon, IonContent, IonHeader, AvatarJugadorComponent],
})
export class OnceIdealComponent implements OnInit {
  /** Ver (usuarios): { jornada_id, numero_jornada }. Editar (panel): la jornada a editar. */
  @Input() jornada: any;
  @Input() jornadasConOnceIdeal: any;
  /**
   * 'ver' (por defecto si llega jornada), 'crear' (por defecto sin jornada) o 'editar'.
   * Lo pasa el panel; la app de los usuarios no lo pasa y sigue en modo 'ver'.
   */
  @Input() modo?: 'ver' | 'crear' | 'editar';
  /** Al crear desde el panel: jornada ya elegida ({ id, numero_jornada }). */
  @Input() jornadaInicial?: { id: number; numero_jornada: number };

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

  /** Ver: la jornada no tiene 11 ideal publicado */
  readonly vacio = signal(false);
  /** Las cuatro líneas en el orden del campo (de arriba abajo) */
  readonly lineas = computed(() => [
    { rol: 'DEL', huecos: this.delanteros() },
    { rol: 'MED', huecos: this.medios() },
    { rol: 'DEF', huecos: this.defensas() },
    { rol: 'POR', huecos: this.portero() },
  ]);

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

  /** Jugadores colocados (para el contador del botón de guardar). */
  colocados = computed(() => this.slots().filter((s) => s.jugador !== null).length);

  constructor() {
    addIcons({ add, closeOutline, warning, checkmarkCircleOutline });
  }

  get modoEfectivo(): 'ver' | 'crear' | 'editar' {
    return this.modo ?? (this.jornada ? 'ver' : 'crear');
  }

  /** Número de jornada para el título (la que se ve, la fija o la elegida) */
  get numeroJornada(): number | null {
    if (this.esVista) return this.jornada?.numero_jornada ?? null;
    return (this.jornadaFija ?? this.jornadaSeleccionada())?.numero_jornada ?? null;
  }

  get esVista(): boolean {
    return this.modoEfectivo === 'ver';
  }

  /** Jornada que no se puede cambiar (al editar, o al crear desde una jornada concreta). */
  get jornadaFija(): { numero_jornada: number } | null {
    if (this.modoEfectivo === 'editar') return this.jornada;
    return this.jornadaInicial ?? null;
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
            this.formacionSeleccionada.set({ id: res.once_ideal_info.formacion_id, formacion: res.once_ideal_info.formacion });
          } else {
            this.slots.set([]);
            this.vacio.set(true);
          }
          this._loadingService.hide();
        },
        error: (error: any) => {
          this._loadingService.hide();
        },
      });
  }

  cerrarModal() {
    this._modalCtrl.dismiss();
  }

  nombre(j: any): string {
    return j.apodo?.trim() || `${j.nombre} ${j.apellidos ?? ''}`.trim();
  }

  signo(puntos: number): string {
    return puntos > 0 ? `+${puntos}` : String(puntos);
  }

  /** Ver: desglose del jugador · Crear/editar: elegir el jugador del hueco */
  pulsarHueco(slot: JugadorSlot) {
    if (this.esVista) {
      if (slot.jugador) this.abrirDetalleJugador(slot);
    } else {
      this.abrirSelectJugador(slot);
    }
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

  cambiarJornada(jornada: any) {
    this.jornadaSeleccionada.set(jornada);
  }

  cambiarFormacion(formacion: any) {
    if (!formacion || formacion.id === this.formacionSeleccionada()?.id) return;
    this.formacionSeleccionada.set(formacion);
    this.recolocarPorPosicion(formacion.formacion);
  }

  /**
   * Nueva formación conservando a cada jugador en su línea (antes se recolocaban por número
   * de hueco y un defensa podía acabar de delantero). Los que no caben se quitan y se avisa.
   */
  private recolocarPorPosicion(formacion: string) {
    const porRol = new Map<JugadorSlot['rol'], any[]>();
    for (const slot of this.slots()) {
      if (!slot.jugador) continue;
      porRol.set(slot.rol, [...(porRol.get(slot.rol) ?? []), slot.jugador]);
    }

    this.slots.set([]);
    this.reconstruirSlots(formacion);

    this.slots.update((slots) =>
      slots.map((s) => {
        const jugador = porRol.get(s.rol)?.shift() ?? null;
        return { ...s, jugador, escudo: jugador?.equipo_escudo ?? null };
      }),
    );

    const sobrantes = [...porRol.values()].reduce((n, lista) => n + lista.length, 0);
    if (sobrantes > 0) {
      this._toastService.showErrorToast(
        `${sobrantes} ${sobrantes === 1 ? 'jugador no cabe' : 'jugadores no caben'} en la ${formacion} y se ${sobrantes === 1 ? 'ha quitado' : 'han quitado'}.`,
      );
    }
  }

  /** Panel: carga un 11 ideal ya publicado para editarlo. */
  private cargarParaEditar() {
    this._loadingService.show();
    this.jornadaSeleccionada.set({ id: this.jornada.jornada_id, numero_jornada: this.jornada.numero_jornada });

    this._formacionesService.getFormaciones().subscribe({
      next: (resp: any) => {
        this.formaciones.set(resp.data || []);
        this._alineacionesService.cargarOnceIdeal(this.jornada.jornada_id).subscribe({
          next: (res: any) => {
            if (res.existe) {
              const info = res.once_ideal_info;
              this.formacionSeleccionada.set(
                this.formaciones().find((f) => f.id === info.formacion_id) ?? { id: info.formacion_id, formacion: info.formacion },
              );
              this.reconstruirSlots(info.formacion, res.jugadores);
            }
            this._loadingService.hide();
          },
          error: () => {
            this._loadingService.hide();
            this._toastService.showErrorToast('No se ha podido cargar el 11 ideal');
          },
        });
      },
      error: () => {
        this._loadingService.hide();
        this._toastService.showErrorToast('No se han podido cargar las formaciones');
      },
    });
  }

  guardarOnceIdeal() {
    if (!this.jornadaSeleccionada() || !this.formacionSeleccionada()) {
      this._toastService.showErrorToast('Elige la jornada y la formación.');
      return;
    }
    this._loadingService.show(this.modoEfectivo === 'editar' ? 'Guardando 11 ideal...' : 'Publicando 11 ideal...');
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
      next: (resp) => {
        this._loadingService.hide();
        this._toastService.showSuccessToast(resp.message || '11 ideal guardado');
        // Se cierra para que el panel recargue la lista
        this._modalCtrl.dismiss(resp, 'confirm');
      },
      error: (err: any) => {
        this._loadingService.hide();
        this._toastService.showErrorToast(err?.error?.message || 'No se ha podido guardar el 11 ideal');
      }
    })
  }

  ngOnInit() {
    switch (this.modoEfectivo) {
      case 'ver':
        this.cargarOnceIdealJornada();
        break;
      case 'editar':
        this.cargarParaEditar();
        break;
      default:
        if (this.jornadaInicial) this.jornadaSeleccionada.set(this.jornadaInicial);
        this.cargarNuevoOnceIdeal();
    }
  }
}

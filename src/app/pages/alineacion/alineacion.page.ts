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
import { MiniCalendarioComponent } from '../../shared/components/mini-calendario/mini-calendario.component';
import { FormacionesService } from '../../core/services/formaciones.service';
import { Ligas, LigasService } from '../../core/services/ligas.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth-service.service';
import { AlineacionesService } from '../../core/services/alineaciones.service';

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
    MiniCalendarioComponent,
  ],
})
export class AlineacionPage implements OnInit {
  // Inyección de servicios
  private _loadingService = inject(LoadingService);
  private _jornadasService = inject(JornadasService);
  private _jugadoresService = inject(JugadoresService);
  private _modalCtrl = inject(ModalController);
  private _equiposService = inject(EquiposService);
  private _formacionesService = inject(FormacionesService);
  private _ligasService = inject(LigasService);
  private _toastService = inject(ToastService);
  private _authService = inject(AuthService);
  private _alineacionesService = inject(AlineacionesService);

  // Estados reactivos (Signals)
  formaciones = signal<any[]>([]);
  formacionSeleccionada = signal<number>(0);
  jornadaObjetivo = signal<any | null>(null);
  equipos = signal<any[]>([]);
  miniCalendario = signal<any[]>([]);
  slots = signal<JugadorSlot[]>([]);

  // Datos de usuario y liga activa
  public liga = this._ligasService.ligaSeleccionada();
  public user = this._authService.currentUser();

  // Computeds para pintar las filas en la plantilla por rol
  delanteros = computed(() => this.slots().filter((s) => s.rol === 'DEL'));
  medios = computed(() => this.slots().filter((s) => s.rol === 'MED'));
  defensas = computed(() => this.slots().filter((s) => s.rol === 'DEF'));
  portero = computed(() => this.slots().filter((s) => s.rol === 'POR'));

  // Contador de jugadores asignados por equipo (máximo 3)
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

  constructor() {
    addIcons({ add, warning });
  }

  ngOnInit() {
    this.inicializarModulo();
  }

  // Carga secuencial e inicial del módulo
  private async inicializarModulo() {
    this._loadingService.show();
    try {
      await this.getEquipos();
      await this.getFormaciones();
      await this.cargarProximaJornada();
    } catch (error) {
      console.error('Error al inicializar la pantalla de alineaciones:', error);
    } finally {
      this._loadingService.hide();
    }
  }

  private getEquipos(): Promise<void> {
    return new Promise((resolve) => {
      this._equiposService.getEquiposLimpios().subscribe({
        next: (resp: any) => {
          this.equipos.set(resp.data || []);
          resolve();
        },
        error: (err) => {
          console.error('Error al cargar equipos:', err);
          resolve();
        },
      });
    });
  }

  private getFormaciones(): Promise<void> {
    return new Promise((resolve) => {
      this._formacionesService.getFormaciones().subscribe({
        next: (resp: any) => {
          if (resp.ok && resp.data.length > 0) {
            this.formaciones.set(resp.data);
            this.formacionSeleccionada.set(resp.data[0].id);
          }
          resolve();
        },
        error: (err) => {
          console.error('Error al cargar formaciones:', err);
          resolve();
        },
      });
    });
  }

  private cargarProximaJornada(): Promise<void> {
    return new Promise((resolve) => {
      this._jornadasService.getSiguienteJornada().subscribe({
        next: async (jornada: any) => {
          this.jornadaObjetivo.set(jornada);
          if (jornada?.id) {
            await Promise.all([
              this.cargarMiniCalendario(jornada.id),
              this.cargarAlineacion(jornada.id),
            ]);
          }
          resolve();
        },
        error: (err) => {
          console.error('Error al obtener siguiente jornada:', err);
          resolve();
        },
      });
    });
  }

  private cargarMiniCalendario(jornadaId: number): Promise<void> {
    return new Promise((resolve) => {
      this._jornadasService.cargarPartidosJornada(jornadaId).subscribe({
        next: (resp: any) => {
          if (resp.ok) this.miniCalendario.set(resp.data);
          resolve();
        },
        error: (err) => {
          console.error('Error al cargar mini calendario:', err);
          resolve();
        },
      });
    });
  }

  private cargarAlineacion(jornadaId: number): Promise<void> {
    return new Promise((resolve) => {
      const payload = {
        liga_id: this.liga?.id,
        usuario_id: this.user?.id,
        jornada_id: jornadaId,
      };

      this._alineacionesService.cargarAlineacion(payload).subscribe({
        next: (res: any) => {
          const formacionDefaultId = this.formaciones()[0]?.id || 1;
          const formacionAUsar =
            res.plantilla?.formacion_id ||
            res.formacion_id ||
            formacionDefaultId;

          this.formacionSeleccionada.set(formacionAUsar);
          this.reconstruirSlots(formacionAUsar);

          // Si hay jugadores guardados previamente, los asignamos en sus slots
          if (res.jugadores && res.jugadores.length > 0) {
            this.slots.update((listaSlots) => {
              const copy = [...listaSlots];
              res.jugadores.forEach((jGuardado: any) => {
                const slotIdx = copy.findIndex(
                  (s) => s.index === jGuardado.hueco_index,
                );
                if (slotIdx !== -1) {
                  copy[slotIdx].jugador = {
                    id: jGuardado.id || jGuardado.jugador_id,
                    nombre: jGuardado.nombre,
                    apodo: jGuardado.apodo,
                    foto: jGuardado.foto,
                    equipo_id: jGuardado.equipo_id,
                    equipo_nombre: jGuardado.equipo_nombre,
                    equipo_escudo: jGuardado.equipo_escudo,
                    posicion: jGuardado.posicion,
                  };
                }
              });
              return copy;
            });
          }
          resolve();
        },
        error: (err) => {
          console.error('Error al obtener la alineación:', err);
          const formacionDefaultId = this.formaciones()[0]?.id || 0;
          this.reconstruirSlots(formacionDefaultId);
          resolve();
        },
      });
    });
  }

  cambiarFormacion(event: any) {
    const nuevaFormacionId = event.detail.value;
    this.formacionSeleccionada.set(nuevaFormacionId);
    this.reconstruirSlots(nuevaFormacionId);
  }

  private reconstruirSlots(idFormacion: number) {
    const formacionObj = this.formaciones().find((f) => f.id === idFormacion);
    if (!formacionObj) return;

    const partes = formacionObj.formacion.split('-').map(Number);
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
        });
        idx++;
      }
    });

    this.slots.set(nuevosSlots);
  }

  // Validación de cupo por equipo (máximo 3)
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
          cssClass: 'card-modal-center',
          backdropDismiss: true,
          componentProps: {
            posicion: slot.rol,
            listaJugadores: resp.data,
            alineacionActual: this.slots(),
            listaEquipos: this.equipos(),
          },
        });

        await modal.present();

        const { data: jugadorElegido } = await modal.onDidDismiss();
        if (jugadorElegido) {
          const validacion = this.validarSeleccionJugador(jugadorElegido);
          if (!validacion.valido) {
            this._toastService.showErrorToast(validacion.mensaje!);
            return;
          }
          this.asignarJugadorASlot(slot.index, jugadorElegido);
        }
      },
      error: (err) => console.error('Error al cargar futbolistas:', err),
    });
  }

  asignarJugadorASlot(index: number, jugador: any) {
    this.slots.update((lista) => {
      const copy = [...lista];
      copy[index].jugador = jugador;
      return copy;
    });
  }

  async guardarAlineacion() {
    const jugadoresAlineados = this.slots()
      .filter((slot) => slot.jugador !== null)
      .map((slot) => ({
        jugador_id: slot.jugador.id,
        posicion: slot.rol,
        hueco_index: slot.index,
      }));

    if (jugadoresAlineados.length !== 11) {
      this._toastService.showErrorToast(
        'Debes completar los 11 jugadores de la alineación.',
      );
      return;
    }

    // Comparar posición jugadores con posición de slots para validar que no haya jugadores en posiciones incorrectas
    const jugadoresEnPosicionesIncorrectas = jugadoresAlineados.some((jugador) => {
      const slot = this.slots().find((s) => s.jugador?.id === jugador.jugador_id);
      return slot?.rol !== jugador.posicion;
    });

    if (jugadoresEnPosicionesIncorrectas) {
      this._toastService.showErrorToast(
        'Los jugadores no pueden estar en posiciones incorrectas.',
      );
      return;
    }

    const payload = {
      liga_id: this.liga?.id,
      usuario_id: this.user?.id,
      jornada_id: this.jornadaObjetivo()?.id,
      formacion_id: this.formacionSeleccionada(),
      jugadores: jugadoresAlineados,
    };

    this._loadingService.show();
    this._alineacionesService.guardarAlineacion(payload).subscribe({
      next: async (resp: any) => {
        this._loadingService.hide();
        if (resp.ok) {
          this._toastService.showSuccessToast(
            'Alineación guardada exitosamente.',
          );
          await this.cargarAlineacion(this.jornadaObjetivo().id);
        }
      },
      error: (error) => {
        this._loadingService.hide();
        console.error('Error al guardar alineación:', error);
        this._toastService.showErrorToast('Error al guardar la alineación.');
      },
    });
  }
}

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  ModalController,
  IonIcon,
  IonAvatar,
  IonItem,
  IonList,
} from '@ionic/angular';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { LoadingService } from '../../core/services/loading.service';
import { IonSegment, IonLabel, IonSegmentButton } from '@ionic/angular';
import { LigasService } from '../../core/services/ligas.service';
import { AuthService } from '../../core/services/auth-service.service';
import { AlineacionesService } from '../../core/services/alineaciones.service';
import { addIcons } from 'ionicons';
import { warning } from 'ionicons/icons';
import { DetalleJugadorJornadaComponent } from '../../shared/modals/detalle-jugador-jornada/detalle-jugador-jornada.component';
import { ClasificacionesService } from '../../core/services/clasificaciones.service';
import { PlantillaClasificacionComponent } from '../../shared/components/plantilla-clasificacion/plantilla-clasificacion.component';

export interface JugadorSlot {
  index: number;
  rol: 'POR' | 'DEF' | 'MED' | 'DEL';
  jugador: any | null; // Nulo significa hueco vacío
  escudo: string | null;
  puntos: number;
}

@Component({
  selector: 'app-clasificaciones',
  templateUrl: './clasificaciones.page.html',
  styleUrls: ['./clasificaciones.page.scss'],
  imports: [
    IonList,
    IonItem,
    IonAvatar,
    IonSegmentButton,
    IonLabel,
    IonSegment,
    IonContent,
    CommonModule,
    FormsModule,
    HeaderComponent,
    PlantillaClasificacionComponent
],
})
export class ClasificacionesPage {
  //private _clasificacionesService = inject(ClasificacionesService);
  private _loadingService = inject(LoadingService);
  private _modalCtrl = inject(ModalController);
  private _ligasService = inject(LigasService);
  private _authService = inject(AuthService);
  private _alineacionesService = inject(AlineacionesService);
  private _clasificacionesService = inject(ClasificacionesService);

  public liga = this._ligasService.ligaSeleccionada();
  public user = this._authService.currentUser();

  // Tab activo: 'jornada_mi_equipo' | 'clasificacion_jornada' | 'clasificacion_general'
  tabActivo = signal<string>('jornada_mi_equipo');

  // Datos globales
  jornadaSeleccionadaId = signal<number | null>(null);
  jornadasDisponibles = signal<any[]>([]);

  // Computeds
  jornadaActivaObj = computed(() => {
    return this.jornadasDisponibles().find(
      (j) => j.id === this.jornadaSeleccionadaId(),
    );
  });

  jornadaActivaTexto = computed(() => {
    const j = this.jornadaActivaObj();
    return j ? `Jornada ${j.numero_jornada}` : '';
  });

  puntosTotalesMiJornada = computed(() => {
    return this.miAlineacionJornada().reduce((sum, slot) => {
      return sum + (slot.jugador?.puntos_jornada || 0);
    }, 0);
  });

  // Puntos Mi Jornada
  miAlineacionJornada = signal<any[]>([]);

  // Clasificaciones
  rankingJornada = signal<any[]>([]);
  rankingGeneral = signal<any[]>([]);

  slots = signal<JugadorSlot[]>([]);
  // Computeds para pintar las filas en la plantilla por rol
  delanteros = computed(() => this.slots().filter((s) => s.rol === 'DEL'));
  medios = computed(() => this.slots().filter((s) => s.rol === 'MED'));
  defensas = computed(() => this.slots().filter((s) => s.rol === 'DEF'));
  portero = computed(() => this.slots().filter((s) => s.rol === 'POR'));

  constructor() {
    addIcons({
      warning,
    });
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

  cambiarTab(event: any) {
    this.tabActivo.set(event.detail.value);

    if (this.tabActivo() === 'clasificacion_general') {
      this.getRankingGeneral();
    }
  }

  async cambiarJornadaFiltro(event: any) {
    this.jornadaSeleccionadaId.set(event.detail.value);
    await this.cargarDatosTabActual();
  }

  async cargarDatosIniciales() {
    /* this._loadingService.show();
    try {
      const jornadas = await this._clasificacionesService.getJornadasFinalizadas().toPromise();
      this.jornadasDisponibles.set(jornadas || []);

      if (jornadas && jornadas.length > 0) {
        // Seleccionamos por defecto la última jornada disputada
        this.jornadaSeleccionadaId.set(jornadas[0].id);
        await this.cargarDatosTabActual();
      }
    } catch (error) {
      console.error('Error al inicializar clasificaciones:', error);
    } finally {
      this._loadingService.hide();
    } */
  }

  async cargarDatosTabActual() {
    /* const jId = this.jornadaSeleccionadaId();
    if (!jId) return;

    this._loadingService.show();
    try {
      if (this.tabActivo() === 'jornada_mi_equipo') {
        const resp = await this._clasificacionesService.getMiAlineacionPuntos(jId).toPromise();
        this.miAlineacionJornada.set(resp?.slots || []);
      } else if (this.tabActivo() === 'clasificacion_jornada') {
        const resp = await this._clasificacionesService.getClasificacionJornada(jId).toPromise();
        this.rankingJornada.set(resp || []);
      } else if (this.tabActivo() === 'clasificacion_general') {
        const resp = await this._clasificacionesService.getClasificacionGeneral().toPromise();
        this.rankingGeneral.set(resp || []);
      }
    } catch (error) {
      console.error('Error al cargar datos del tab:', error);
    } finally {
      this._loadingService.hide();
    } */
  }

  async cargarAlineacionesJornadas() {
    this._loadingService.show();
    let data = {
      liga_id: this.liga?.id,
      usuario_id: this.user?.id,
      jornada_id: this.jornadaSeleccionadaId() || 6,
    };
    this._alineacionesService.cargarAlineacionesJornadas(data).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          let jornadas = resp.data.map((jornada: any) => {
            return {
              ...jornada,
              puntos_totales: this.sumarPuntosJornada(jornada.jugadores),
            };
          });
          this.reconstuirSlots(resp.data[0].formacion, resp.data[0].jugadores);
          this.jornadasDisponibles.set(jornadas);
          this.jornadaSeleccionadaId.set(jornadas[0].jornada_id);
          this._loadingService.hide();
        }
      },
      error: (err: any) => {
        console.error('Error al cargar jornadas:', err);
        this._loadingService.hide();
      },
    });
  }

  seleccionarJornada(jornada: any) {
    this.jornadaSeleccionadaId.set(jornada.jornada_id);
    this.reconstuirSlots(jornada.formacion, jornada.jugadores);
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

  private sumarPuntosJornada(jugadores: any[]) {
    return jugadores.reduce((sum, jugador) => {
      return sum + (jugador.puntos_jornada || 0);
    }, 0);
  }

  async getRankingGeneral() {
    this._loadingService.show();
    try {
      let data = {
        liga_id: this.liga?.id,
      };
      this._clasificacionesService.getClasificacion(data).subscribe({
        next: (resp: any) => {
          if (resp.ok) {
            this.rankingGeneral.set(resp.data || []);
            this._loadingService.hide();
          }
        },
        error: (err: any) => {
          console.error('Error al cargar jornadas:', err);
          this._loadingService.hide();
        },
      });
    } catch (error) {
      console.error('Error al cargar datos del tab:', error);
    } finally {
      this._loadingService.hide();
    }
  }

  async verAlineacionUsuario(userClasificacion: any) {
    const modal = await this._modalCtrl.create({
      component: PlantillaClasificacionComponent,
      initialBreakpoint: 1,
      breakpoints: [0, 0.5, 0.75, 1],
      handle: false,
      mode: 'md',
      componentProps: {
        user: userClasificacion,
        liga: this.liga,
      },
    });

    await modal.present();
  }
}

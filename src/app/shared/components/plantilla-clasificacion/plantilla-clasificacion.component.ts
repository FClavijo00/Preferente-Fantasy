import { Component, computed, inject, Input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { closeOutline, refreshOutline, star } from 'ionicons/icons';
import {
  AlineacionJornada,
  AlineacionesService,
  JugadorAlineacionJornada,
} from '../../../core/services/alineaciones.service';
import { JornadasService, PuntuacionJornada } from '../../../core/services/jornadas-service';
import { LINEAS, RolFormacion, rolesFormacion } from '../../../core/utils/formacion';
import { AvatarJugadorComponent } from '../avatar-jugador/avatar-jugador.component';
import { DetalleJugadorJornadaComponent } from '../../modals/detalle-jugador-jornada/detalle-jugador-jornada.component';
import { OnceIdealComponent } from '../../modals/once-ideal/once-ideal.component';
import { opcionesModalAlto } from '../../../core/utils/modal-auto';

interface Hueco {
  index: number;
  rol: RolFormacion;
  jugador: JugadorAlineacionJornada | null;
}

/** Datos del usuario para la cabecera cuando se abre como modal */
export interface UsuarioCabecera {
  nombre_club: string;
  nombre_usuario: string;
  image_url: string | null;
}

/**
 * Alineación de un usuario jornada a jornada, con los puntos de cada jugador:
 * fila de jornadas (puntos de cada una), resumen (puntos y puesto) y el campo.
 *
 * - En "Mi equipo" va dentro de la página: [miEquipo]="true" muestra el botón del 11 ideal.
 * - Para ver a otro usuario se abre como modal (sheet) pasando "usuario": lleva cabecera y cerrar.
 *
 *   <app-plantilla-clasificacion [ligaId]="id" [usuarioId]="uid" [miEquipo]="true" />
 *   modalCtrl.create({ component: PlantillaClasificacionComponent, ...opcionesModalAuto(),
 *                      componentProps: { ligaId, usuarioId, usuario, jornadaInicialId } })
 */
@Component({
  selector: 'app-plantilla-clasificacion',
  templateUrl: './plantilla-clasificacion.component.html',
  styleUrls: ['./plantilla-clasificacion.component.scss'],
  imports: [IonIcon, IonSkeletonText, NgTemplateOutlet, AvatarJugadorComponent],
})
export class PlantillaClasificacionComponent {
  // @Input con setter (no input()): también llegan por componentProps al abrirlo como modal
  @Input() set ligaId(v: number | null | undefined) {
    this._ligaId = v ?? null;
    this.programarCarga();
  }
  @Input() set usuarioId(v: number | null | undefined) {
    this._usuarioId = v ?? null;
    this.programarCarga();
  }
  /** Jornada con la que abrir; si no está (o no se pasa), la más reciente (la que está en juego si la hay). */
  @Input() set jornadaInicialId(id: number | null | undefined) {
    this._jornadaInicialId = id ?? null;
    const j = this.jornadas().find((x) => x.jornada_id === this._jornadaInicialId);
    if (j && j.jornada_id !== this.seleccionada()?.jornada_id) this.seleccionar(j);
  }
  /** Si llega, se pinta como modal: cabecera con el usuario y botón de cerrar */
  @Input() usuario: UsuarioCabecera | null = null;
  /** Mi equipo: botón flotante del 11 ideal */
  @Input() miEquipo = false;

  private _ligaId: number | null = null;
  private _usuarioId: number | null = null;
  private _jornadaInicialId: number | null = null;
  private _clave = '';
  private _cargaProgramada = false;
  private readonly _cache = new Map<number, AlineacionJornada | null>();

  private _jornadasService = inject(JornadasService);
  private _alineacionesService = inject(AlineacionesService);
  private _modalCtrl = inject(ModalController);

  readonly estado = signal<'cargando' | 'listo' | 'vacio' | 'error'>('cargando');
  readonly jornadas = signal<PuntuacionJornada[]>([]);
  readonly seleccionada = signal<PuntuacionJornada | null>(null);
  readonly alineacion = signal<AlineacionJornada | null>(null);
  readonly estadoAlineacion = signal<'cargando' | 'listo' | 'error'>('cargando');

  readonly lineas = computed(() => {
    const a = this.alineacion();
    if (!a?.formacion) return [];
    const porHueco = new Map(a.jugadores.map((j) => [j.hueco_index, j]));
    const huecos: Hueco[] = rolesFormacion(a.formacion).map((rol, index) => ({
      index,
      rol,
      jugador: porHueco.get(index) ?? null,
    }));
    return LINEAS.map((rol) => ({ rol, huecos: huecos.filter((h) => h.rol === rol) }));
  });

  constructor() {
    addIcons({ closeOutline, refreshOutline, star });
  }

  /** Espera a tener liga y usuario (pueden llegar por separado) y carga una sola vez por pareja. */
  private programarCarga() {
    if (this._cargaProgramada) return;
    this._cargaProgramada = true;
    queueMicrotask(() => {
      this._cargaProgramada = false;
      const clave = `${this._ligaId}|${this._usuarioId}`;
      if (this._ligaId === null || this._usuarioId === null || clave === this._clave) return;
      this._clave = clave;
      this._cache.clear();
      this.cargar();
    });
  }

  async cargar() {
    const liga = this._ligaId;
    const usuario = this._usuarioId;
    if (liga === null || usuario === null) return;
    this.estado.set('cargando');
    try {
      const res = await firstValueFrom(this._jornadasService.getPuntuacionesJornadas(liga, usuario));
      if (`${liga}|${usuario}` !== this._clave) return; // cambió mientras cargaba
      const jornadas = res.data ?? [];
      this.jornadas.set(jornadas);
      if (jornadas.length === 0) {
        this.estado.set('vacio');
        return;
      }
      this.estado.set('listo');
      this.seleccionar(jornadas.find((j) => j.jornada_id === this._jornadaInicialId) ?? jornadas[0]);
    } catch {
      this.estado.set('error');
    }
  }

  async seleccionar(j: PuntuacionJornada) {
    this.seleccionada.set(j);
    if (this._cache.has(j.jornada_id)) {
      this.alineacion.set(this._cache.get(j.jornada_id)!);
      this.estadoAlineacion.set('listo');
      return;
    }
    this.estadoAlineacion.set('cargando');
    try {
      const res = await firstValueFrom(
        this._alineacionesService.cargarAlineacionesJornadas({
          liga_id: this._ligaId!,
          usuario_id: this._usuarioId!,
          jornada_id: j.jornada_id,
        }),
      );
      const alineacion = res.data?.[0] ?? null;
      // La jornada en juego se vuelve a pedir cada vez (los puntos cambian); las cerradas se guardan
      if (j.estado === 'CERRADA') this._cache.set(j.jornada_id, alineacion);
      if (this.seleccionada()?.jornada_id !== j.jornada_id) return;
      this.alineacion.set(alineacion);
      this.estadoAlineacion.set('listo');
    } catch {
      if (this.seleccionada()?.jornada_id === j.jornada_id) this.estadoAlineacion.set('error');
    }
  }

  nombre(j: JugadorAlineacionJornada): string {
    return j.apodo?.trim() || `${j.nombre} ${j.apellidos ?? ''}`.trim();
  }

  signo(puntos: number): string {
    return puntos > 0 ? `+${puntos}` : String(puntos);
  }

  async verJugador(j: JugadorAlineacionJornada) {
    if (!j.jugo) return; // no jugó: no hay desglose
    const modal = await this._modalCtrl.create({
      component: DetalleJugadorJornadaComponent,
      cssClass: 'card-modal-center',
      backdropDismiss: true,
      componentProps: {
        jugador: {
          ...j,
          id: j.jugador_id,
          desglose: j.desglose_puntos,
        },
        jornada: this.seleccionada()?.numero_jornada,
      },
    });
    await modal.present();
  }

  async verOnceIdeal() {
    const j = this.seleccionada();
    if (!j?.tiene_once_ideal) return;
    const modal = await this._modalCtrl.create({
      component: OnceIdealComponent,
      ...opcionesModalAlto(),
      componentProps: { jornada: { jornada_id: j.jornada_id, numero_jornada: j.numero_jornada } },
    });
    await modal.present();
  }

  cerrar() {
    this._modalCtrl.dismiss();
  }
}

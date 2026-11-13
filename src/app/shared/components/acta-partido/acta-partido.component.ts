import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { closeOutline, football, locationOutline, refreshOutline, star } from 'ionicons/icons';
import {
  ActaPublica,
  JugadorActaPublica,
  PartidosService,
} from '../../../core/services/partidos.service';
import { AvatarJugadorComponent } from '../avatar-jugador/avatar-jugador.component';
import { DetalleJugadorJornadaComponent } from '../../modals/detalle-jugador-jornada/detalle-jugador-jornada.component';

type TipoTarjeta = 'amarilla' | 'doble' | 'roja';

/** Un evento en la línea de tiempo: a la izquierda (local) o a la derecha (visitante). */
interface EventoLinea {
  clave: string;
  lado: 'local' | 'visitante';
  tipo: 'gol' | 'tarjeta';
  tarjeta: TipoTarjeta | null;
  jugador: string;
  minuto: number | null;
  /** (p) penalti · (p.p.) en propia */
  marca: string;
}

/** Lo que se pinta en la fila de cada jugador: goles, tarjetas y si fue el destacado. */
interface ResumenJugador {
  goles: number;
  tarjetas: TipoTarjeta[];
  destacado: boolean;
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

const tipoTarjeta = (tipo: string): TipoTarjeta =>
  tipo === 'ROJA' ? 'roja' : tipo.startsWith('DOBLE') ? 'doble' : 'amarilla';

/**
 * Acta pública de un partido (sheet en el móvil / tarjeta en el escritorio):
 * marcador, eventos (goles, tarjetas, destacado) y alineaciones con los puntos.
 *
 *   modalCtrl.create({ component: ActaPartidoComponent, ...opcionesModalAuto(),
 *                      componentProps: { partidoId } })
 */
@Component({
  selector: 'app-acta-partido',
  templateUrl: './acta-partido.component.html',
  styleUrls: ['./acta-partido.component.scss'],
  imports: [IonIcon, IonSkeletonText, NgTemplateOutlet, AvatarJugadorComponent],
})
export class ActaPartidoComponent implements OnInit {
  /** Lo pasa quien abre el modal con componentProps */
  @Input({ required: true }) partidoId!: number;

  private _partidosService = inject(PartidosService);
  private _modalCtrl = inject(ModalController);

  readonly acta = signal<ActaPublica | null>(null);
  readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');

  readonly fecha = computed(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/.exec(this.acta()?.fecha_local ?? '');
    if (!m) return null;
    const dia = FORMATO_FECHA.format(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return `${dia} · ${m[4]}`;
  });

  /**
   * Línea de tiempo: goles y tarjetas ordenados por minuto. Los que no tienen minuto van al
   * final, en el orden en que se metieron en el acta (primero goles y luego tarjetas).
   * En goles el lado es el equipo al que sube el gol (también en propia puerta).
   */
  readonly linea = computed<EventoLinea[]>(() => {
    const a = this.acta();
    const e = a?.eventos;
    if (!a || !e) return [];
    const lado = (equipoId: number): EventoLinea['lado'] =>
      equipoId === a.equipo_local_id ? 'local' : 'visitante';

    const goles = (e.goles ?? []).map(
      (g, i): EventoLinea & { orden: number } => ({
        clave: 'g' + g.id,
        lado: lado(g.equipo_id),
        tipo: 'gol',
        tarjeta: null,
        jugador: g.jugador,
        minuto: g.minuto,
        marca: g.tipo === 'PENALTI' ? '(p)' : g.tipo === 'PROPIA' ? '(p.p.)' : '',
        orden: i,
      }),
    );
    const tarjetas = (e.tarjetas ?? []).map(
      (t, i): EventoLinea & { orden: number } => ({
        clave: 't' + t.id,
        lado: lado(t.equipo_id),
        tipo: 'tarjeta',
        tarjeta: tipoTarjeta(t.tipo),
        jugador: t.jugador,
        minuto: t.minuto,
        marca: '',
        orden: goles.length + i,
      }),
    );

    return [...goles, ...tarjetas]
      .sort((x, y) => {
        if (x.minuto !== null && y.minuto !== null && x.minuto !== y.minuto) return x.minuto - y.minuto;
        if (x.minuto === null && y.minuto !== null) return 1;
        if (x.minuto !== null && y.minuto === null) return -1;
        return x.orden - y.orden;
      })
      .map(({ orden, ...ev }) => ev);
  });

  readonly hayEventos = computed(() => this.linea().length > 0 || !!this.acta()?.eventos?.destacado);

  readonly titularesLocal = computed(() => (this.acta()?.jugadores_local ?? []).filter((j) => j.titular));
  readonly suplentesLocal = computed(() => (this.acta()?.jugadores_local ?? []).filter((j) => !j.titular));
  readonly titularesVisitante = computed(() => (this.acta()?.jugadores_visitante ?? []).filter((j) => j.titular));
  readonly suplentesVisitante = computed(() => (this.acta()?.jugadores_visitante ?? []).filter((j) => !j.titular));

  /** Goles (los suyos, no los en propia), tarjetas y destacado de cada jugador. */
  private readonly resumenes = computed(() => {
    const mapa = new Map<number, ResumenJugador>();
    const e = this.acta()?.eventos;
    if (!e) return mapa;
    const de = (id: number) => {
      if (!mapa.has(id)) mapa.set(id, { goles: 0, tarjetas: [], destacado: false });
      return mapa.get(id)!;
    };
    e.goles.filter((g) => g.tipo !== 'PROPIA').forEach((g) => de(g.jugador_id).goles++);
    e.tarjetas.forEach((t) => de(t.jugador_id).tarjetas.push(tipoTarjeta(t.tipo)));
    if (e.destacado) de(e.destacado.jugador_id).destacado = true;
    return mapa;
  });

  constructor() {
    addIcons({ closeOutline, football, locationOutline, refreshOutline, star });
  }

  ngOnInit() {
    if (this.partidoId) this.cargar();
  }

  async cargar() {
    this.estado.set('cargando');
    try {
      const res = await firstValueFrom(this._partidosService.getActaPartidoPuntos(this.partidoId));
      this.acta.set(res.data);
      this.estado.set('listo');
    } catch {
      this.estado.set('error');
    }
  }

  nombre(j: JugadorActaPublica): string {
    return j.apodo?.trim() || `${j.nombre} ${j.apellidos ?? ''}`.trim();
  }

  resumen(j: JugadorActaPublica): ResumenJugador | null {
    return this.resumenes().get(j.id) ?? null;
  }

  /** Para pintar N iconos de balón con @for */
  repetir(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  signo(puntos: number): string {
    return puntos > 0 ? `+${puntos}` : String(puntos);
  }

  async verDesglosePuntos(jugador: JugadorActaPublica) {
    const modal = await this._modalCtrl.create({
      component: DetalleJugadorJornadaComponent,
      cssClass: 'card-modal-center',
      backdropDismiss: true,
      componentProps: { jugador, jornada: this.acta()?.numero_jornada },
    });
    await modal.present();
  }

  cerrar() {
    this._modalCtrl.dismiss();
  }
}

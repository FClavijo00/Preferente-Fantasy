import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonContent } from '@ionic/angular/ion-content';
import { IonFooter } from '@ionic/angular/ion-footer';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSpinner } from '@ionic/angular/ion-spinner';
import { IonSegment } from '@ionic/angular/ion-segment';
import { IonSegmentButton } from '@ionic/angular/ion-segment-button';
import { IonLabel } from '@ionic/angular/ion-label';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { add, chevronDown, closeOutline, footballOutline, peopleOutline, starOutline, trashOutline } from 'ionicons/icons';
import {
  ActaPartido,
  EventoActa,
  JugadorActa,
  PartidosService,
  PayloadActa,
  Posicion,
  TipoGol,
  TipoTarjeta,
} from '../../../core/services/partidos.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingService } from '../../../core/services/loading.service';
import { opcionesModalAuto } from '../../../core/utils/modal-auto';
import { SelectorJugadorActasComponent } from '../selector-jugador-actas/selector-jugador-actas.component';

/** Lo que llega desde Calendario. */
export interface PartidoActa {
  partido_id: number;
  equipo_local_id: number;
  equipo_visitante_id: number;
  local_nombre: string;
  visitante_nombre: string;
  local_escudo?: string;
  visitante_escudo?: string;
  goles_local: number | null;
  goles_visitante: number | null;
  tiene_acta: boolean;
}

type Lado = 'local' | 'visitante';
type Pestana = 'alineaciones' | 'goles' | 'tarjetas' | 'destacado';
type Grupo = 'titulares' | 'suplentes';

interface Convocatoria {
  titulares: (number | null)[];
  suplentes: (number | null)[];
}

interface GolForm {
  jugador_id: number | null;
  tipo: TipoGol;
  minuto: number | null;
}

interface TarjetaForm {
  uid: number;
  lado: Lado;
  jugador_id: number | null;
  tipo: TipoTarjeta;
  minuto: number | null;
}

interface GrupoPosicion {
  posicion: Posicion;
  titulo: string;
  jugadores: JugadorActa[];
}

const TITULARES = 11;
const SUPLENTES = 7;

const TITULO_POSICION: Record<Posicion, string> = {
  POR: 'Porteros',
  DEF: 'Defensas',
  MED: 'Centrocampistas',
  DEL: 'Delanteros',
};

const rellenar = (ids: number[] | undefined, minimo: number): (number | null)[] => {
  const lista: (number | null)[] = [...(ids ?? [])];
  while (lista.length < minimo) lista.push(null);
  return lista;
};

/** Agrupa una lista (ya ordenada por posición y nombre) en grupos para los <optgroup>. */
const agrupar = (jugadores: JugadorActa[]): GrupoPosicion[] =>
  (Object.keys(TITULO_POSICION) as Posicion[])
    .map((posicion) => ({
      posicion,
      titulo: TITULO_POSICION[posicion],
      jugadores: jugadores.filter((j) => j.posicion === posicion),
    }))
    .filter((g) => g.jugadores.length > 0);

@Component({
  selector: 'app-crear-editar-acta-partido',
  templateUrl: './crear-editar-acta-partido.component.html',
  styleUrls: ['./crear-editar-acta-partido.component.scss'],
  imports: [
    IonHeader,
    IonContent,
    IonFooter,
    IonButton,
    IonIcon,
    IonSpinner,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
})
export class CrearEditarActaPartidoComponent implements OnInit {
  /** Lo pasa Calendario con componentProps (Ionic lo asigna como propiedad). */
  @Input() partido!: PartidoActa;

  private _partidosService = inject(PartidosService);
  private _modalCtrl = inject(ModalController);
  private _toastService = inject(ToastService);
  private _loadingService = inject(LoadingService);

  readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');
  readonly enviando = signal(false);
  readonly pestana = signal<Pestana>('alineaciones');
  readonly ladoAlineacion = signal<Lado>('local');

  readonly jugadores = signal<Record<Lado, JugadorActa[]>>({ local: [], visitante: [] });
  readonly convocatoria = signal<Record<Lado, Convocatoria>>({
    local: { titulares: rellenar([], TITULARES), suplentes: rellenar([], SUPLENTES) },
    visitante: { titulares: rellenar([], TITULARES), suplentes: rellenar([], SUPLENTES) },
  });
  readonly goles = signal<Record<Lado, GolForm[]>>({ local: [], visitante: [] });
  readonly tarjetas = signal<TarjetaForm[]>([]);
  readonly destacadoLado = signal<Lado | null>(null);
  readonly destacadoId = signal<number | null>(null);

  private siguienteUid = 1;

  readonly lados: Lado[] = ['local', 'visitante'];
  readonly grupos: Grupo[] = ['titulares', 'suplentes'];
  readonly tiposGol: { id: TipoGol; texto: string }[] = [
    { id: 'NORMAL', texto: 'Normal' },
    { id: 'PENALTI', texto: 'Penalti' },
    { id: 'PROPIA', texto: 'En propia' },
  ];
  readonly tiposTarjeta: { id: TipoTarjeta; texto: string }[] = [
    { id: 'AMARILLA', texto: 'Amarilla' },
    { id: 'DOBLE AMARILLA', texto: '2ª amarilla (expulsión)' },
    { id: 'ROJA', texto: 'Roja directa' },
  ];

  // ---------- Derivados ----------

  /** Plantilla completa de cada equipo agrupada por posición (para la convocatoria). */
  readonly plantillaAgrupada = computed(() => ({
    local: agrupar(this.jugadores().local),
    visitante: agrupar(this.jugadores().visitante),
  }));

  /** Ids convocados (titulares + suplentes) por equipo. */
  readonly idsConvocados = computed(() => {
    const c = this.convocatoria();
    const ids = (l: Lado) => new Set([...c[l].titulares, ...c[l].suplentes].filter((id): id is number => id !== null));
    return { local: ids('local'), visitante: ids('visitante') };
  });

  /** Convocados de cada equipo, en el orden de la plantilla, agrupados por posición. */
  readonly convocadosAgrupados = computed(() => {
    const ids = this.idsConvocados();
    const j = this.jugadores();
    return {
      local: agrupar(j.local.filter((x) => ids.local.has(x.id))),
      visitante: agrupar(j.visitante.filter((x) => ids.visitante.has(x.id))),
    };
  });

  readonly numConvocados = computed(() => ({
    local: this.idsConvocados().local.size,
    visitante: this.idsConvocados().visitante.size,
  }));

  readonly totalGoles = computed(() => this.goles().local.length + this.goles().visitante.length);

  /** Todos los jugadores del partido por id (para pintar el elegido en cada botón). */
  private readonly jugadoresPorId = computed(
    () => new Map([...this.jugadores().local, ...this.jugadores().visitante].map((j) => [j.id, j])),
  );

  constructor() {
    addIcons({ add, chevronDown, closeOutline, footballOutline, peopleOutline, starOutline, trashOutline });
  }

  async ngOnInit() {
    await this.cargar();
  }

  // ===================== Carga =====================

  async cargar() {
    this.estado.set('cargando');
    try {
      const [jugadores, acta] = await Promise.all([
        firstValueFrom(this._partidosService.getJugadoresActa(this.partido.partido_id)),
        this.partido.tiene_acta
          ? firstValueFrom(this._partidosService.obtenerActa(this.partido.partido_id))
          : Promise.resolve(null),
      ]);
      this.jugadores.set(jugadores.data);
      this.aplicarActa(acta);
      this.estado.set('listo');
    } catch {
      this.estado.set('error');
    }
  }

  /** Vuelca un acta guardada (o ninguna) en el formulario. Los goles cuadran con el resultado. */
  private aplicarActa(acta: ActaPartido | null) {
    this.convocatoria.set({
      local: { titulares: rellenar(acta?.titulares_local, TITULARES), suplentes: rellenar(acta?.suplentes_local, SUPLENTES) },
      visitante: {
        titulares: rellenar(acta?.titulares_visitante, TITULARES),
        suplentes: rellenar(acta?.suplentes_visitante, SUPLENTES),
      },
    });

    const aGoles = (eventos: EventoActa[] | undefined, cantidad: number): GolForm[] => {
      const lista: GolForm[] = (eventos ?? []).slice(0, cantidad).map((e) => ({
        jugador_id: e.jugador_id,
        tipo: (e.tipo as TipoGol) || 'NORMAL',
        minuto: e.minuto ?? null,
      }));
      while (lista.length < cantidad) lista.push({ jugador_id: null, tipo: 'NORMAL', minuto: null });
      return lista;
    };
    this.goles.set({
      local: aGoles(acta?.goles_local, this.partido.goles_local ?? 0),
      visitante: aGoles(acta?.goles_visitante, this.partido.goles_visitante ?? 0),
    });

    const aTarjetas = (eventos: EventoActa[] | undefined, lado: Lado): TarjetaForm[] =>
      (eventos ?? []).map((e) => ({
        uid: this.siguienteUid++,
        lado,
        jugador_id: e.jugador_id,
        tipo: e.tipo as TipoTarjeta,
        minuto: e.minuto ?? null,
      }));
    this.tarjetas.set([...aTarjetas(acta?.tarjetas_local, 'local'), ...aTarjetas(acta?.tarjetas_visitante, 'visitante')]);

    const destacado = acta?.jugador_destacado_id ?? null;
    this.destacadoId.set(destacado);
    this.destacadoLado.set(
      destacado === null ? null : this.jugadores().visitante.some((j) => j.id === destacado) ? 'visitante' : 'local',
    );
  }

  // ===================== Ayudas de vista =====================

  nombre(j: JugadorActa): string {
    return j.apodo?.trim() || `${j.nombre} ${j.apellidos ?? ''}`.trim();
  }

  jugador(id: number | null): JugadorActa | null {
    return id === null ? null : (this.jugadoresPorId().get(id) ?? null);
  }

  nombreEquipo(lado: Lado): string {
    return lado === 'local' ? this.partido.local_nombre : this.partido.visitante_nombre;
  }

  /** Lado del que salen los autores de un gol: en propia, del rival. */
  ladoAutor(lado: Lado, tipo: TipoGol): Lado {
    return tipo === 'PROPIA' ? (lado === 'local' ? 'visitante' : 'local') : lado;
  }

  private aId(valor: string): number | null {
    return valor ? Number(valor) : null;
  }

  private aMinuto(valor: string): number | null {
    if (valor === '') return null;
    const n = Math.round(Number(valor));
    return Number.isFinite(n) ? Math.max(0, Math.min(130, n)) : null;
  }

  // ===================== Selector de jugador =====================

  /**
   * Abre el selector propio de jugador. Devuelve el id elegido, null si se vacía,
   * o undefined si se cierra sin elegir.
   */
  private async elegirJugador(opciones: {
    titulo: string;
    subtitulo: string;
    grupos: { posicion: Posicion; titulo: string; jugadores: JugadorActa[] }[];
    seleccionado: number | null;
    ocupados?: number[];
    permitirVacio?: boolean;
    textoVacio?: string;
    mensajeSinJugadores?: string;
  }): Promise<number | null | undefined> {
    const modal = await this._modalCtrl.create({
      component: SelectorJugadorActasComponent,
      componentProps: opciones,
      ...opcionesModalAuto(),
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<number | null>();
    return role === 'confirm' ? (data ?? null) : undefined;
  }

  private readonly sinConvocados = 'Primero elige la convocatoria en «Alineaciones».';

  async abrirSelectorConvocado(lado: Lado, grupo: Grupo, indice: number) {
    const actual = this.convocatoria()[lado][grupo][indice];
    const id = await this.elegirJugador({
      titulo: `${grupo === 'titulares' ? 'Titular' : 'Suplente'} ${indice + 1}`,
      subtitulo: this.nombreEquipo(lado),
      grupos: this.plantillaAgrupada()[lado],
      seleccionado: actual,
      ocupados: [...this.idsConvocados()[lado]],
      textoVacio: 'Dejar hueco vacío',
    });
    if (id !== undefined) this.elegirConvocado(lado, grupo, indice, id === null ? '' : String(id));
  }

  async abrirSelectorGol(lado: Lado, indice: number) {
    const gol = this.goles()[lado][indice];
    const autor = this.ladoAutor(lado, gol.tipo);
    const id = await this.elegirJugador({
      titulo: gol.tipo === 'PROPIA' ? 'Gol en propia' : 'Autor del gol',
      subtitulo: gol.tipo === 'PROPIA' ? `Jugador del ${this.nombreEquipo(autor)}` : this.nombreEquipo(lado),
      grupos: this.convocadosAgrupados()[autor],
      seleccionado: gol.jugador_id,
      permitirVacio: false,
      mensajeSinJugadores: this.sinConvocados,
    });
    if (id !== undefined) this.cambiarGol(lado, indice, { jugador_id: id });
  }

  async abrirSelectorTarjeta(uid: number) {
    const tarjeta = this.tarjetas().find((t) => t.uid === uid);
    if (!tarjeta) return;
    const id = await this.elegirJugador({
      titulo: 'Jugador de la tarjeta',
      subtitulo: this.nombreEquipo(tarjeta.lado),
      grupos: this.convocadosAgrupados()[tarjeta.lado],
      seleccionado: tarjeta.jugador_id,
      permitirVacio: false,
      mensajeSinJugadores: this.sinConvocados,
    });
    if (id !== undefined) this.cambiarTarjeta(uid, { jugador_id: id });
  }

  async abrirSelectorDestacado(lado: Lado) {
    const id = await this.elegirJugador({
      titulo: 'Jugador destacado',
      subtitulo: this.nombreEquipo(lado),
      grupos: this.convocadosAgrupados()[lado],
      seleccionado: this.destacadoId(),
      permitirVacio: false,
      mensajeSinJugadores: this.sinConvocados,
    });
    if (id !== undefined) this.destacadoId.set(id);
  }

  // ===================== Convocatoria =====================

  elegirConvocado(lado: Lado, grupo: Grupo, indice: number, valor: string) {
    this.convocatoria.update((c) => {
      const lista = [...c[lado][grupo]];
      lista[indice] = this.aId(valor);
      return { ...c, [lado]: { ...c[lado], [grupo]: lista } };
    });
  }

  anadirSuplente(lado: Lado) {
    this.convocatoria.update((c) => ({ ...c, [lado]: { ...c[lado], suplentes: [...c[lado].suplentes, null] } }));
  }

  // ===================== Goles =====================

  cambiarGol(lado: Lado, indice: number, cambios: Partial<GolForm>) {
    this.goles.update((g) => {
      const lista = [...g[lado]];
      const anterior = lista[indice];
      const nuevo = { ...anterior, ...cambios };
      // Si cambia a/desde "en propia", el autor deja de valer (es del otro equipo)
      if (cambios.tipo && (cambios.tipo === 'PROPIA') !== (anterior.tipo === 'PROPIA')) nuevo.jugador_id = null;
      lista[indice] = nuevo;
      return { ...g, [lado]: lista };
    });
  }

  elegirTipoGol(lado: Lado, indice: number, valor: string) {
    this.cambiarGol(lado, indice, { tipo: valor as TipoGol });
  }

  elegirMinutoGol(lado: Lado, indice: number, valor: string) {
    this.cambiarGol(lado, indice, { minuto: this.aMinuto(valor) });
  }

  // ===================== Tarjetas =====================

  anadirTarjeta() {
    this.tarjetas.update((t) => [
      ...t,
      { uid: this.siguienteUid++, lado: 'local', jugador_id: null, tipo: 'AMARILLA', minuto: null },
    ]);
  }

  quitarTarjeta(uid: number) {
    this.tarjetas.update((t) => t.filter((x) => x.uid !== uid));
  }

  cambiarTarjeta(uid: number, cambios: Partial<TarjetaForm>) {
    this.tarjetas.update((t) =>
      t.map((x) => {
        if (x.uid !== uid) return x;
        const nueva = { ...x, ...cambios };
        if (cambios.lado && cambios.lado !== x.lado) nueva.jugador_id = null;
        return nueva;
      }),
    );
  }

  elegirTipoTarjeta(uid: number, valor: string) {
    this.cambiarTarjeta(uid, { tipo: valor as TipoTarjeta });
  }

  elegirMinutoTarjeta(uid: number, valor: string) {
    this.cambiarTarjeta(uid, { minuto: this.aMinuto(valor) });
  }

  // ===================== Destacado =====================

  elegirLadoDestacado(lado: Lado) {
    if (this.destacadoLado() === lado) return;
    this.destacadoLado.set(lado);
    this.destacadoId.set(null);
  }

  quitarDestacado() {
    this.destacadoLado.set(null);
    this.destacadoId.set(null);
  }

  // ===================== Guardar =====================

  /** Devuelve el primer problema encontrado (y la pestaña donde está) o null. */
  private validar(): { mensaje: string; pestana: Pestana } | null {
    const ids = this.idsConvocados();

    for (const lado of this.lados) {
      for (const gol of this.goles()[lado]) {
        if (gol.jugador_id === null) {
          return { mensaje: `Falta el autor de algún gol del ${this.nombreEquipo(lado)}`, pestana: 'goles' };
        }
        if (!ids[this.ladoAutor(lado, gol.tipo)].has(gol.jugador_id)) {
          return { mensaje: 'Algún goleador no está convocado', pestana: 'goles' };
        }
      }
    }

    for (const t of this.tarjetas()) {
      if (t.jugador_id === null) return { mensaje: 'Falta el jugador de alguna tarjeta', pestana: 'tarjetas' };
      if (!ids[t.lado].has(t.jugador_id)) return { mensaje: 'Alguna tarjeta es de un jugador no convocado', pestana: 'tarjetas' };
    }

    const destacado = this.destacadoId();
    const lado = this.destacadoLado();
    if (destacado !== null && lado && !ids[lado].has(destacado)) {
      return { mensaje: 'El jugador destacado no está convocado', pestana: 'destacado' };
    }
    return null;
  }

  async guardar() {
    if (this.enviando()) return;

    const problema = this.validar();
    if (problema) {
      this.pestana.set(problema.pestana);
      this._toastService.showErrorToast(problema.mensaje);
      return;
    }

    const equipo = (lado: Lado) => (lado === 'local' ? this.partido.equipo_local_id : this.partido.equipo_visitante_id);
    const limpiar = (lista: (number | null)[]) => lista.filter((id): id is number => id !== null);
    const c = this.convocatoria();

    const payload: PayloadActa = {
      partido_id: this.partido.partido_id,
      titulares_local: limpiar(c.local.titulares),
      suplentes_local: limpiar(c.local.suplentes),
      titulares_visitante: limpiar(c.visitante.titulares),
      suplentes_visitante: limpiar(c.visitante.suplentes),
      // En los goles en propia, equipo_id es el equipo que suma el gol (como hasta ahora)
      goles: this.lados.flatMap((lado) =>
        this.goles()[lado].map((g) => ({ jugador_id: g.jugador_id!, equipo_id: equipo(lado), tipo: g.tipo, minuto: g.minuto })),
      ),
      tarjetas: this.tarjetas().map((t) => ({
        jugador_id: t.jugador_id!,
        equipo_id: equipo(t.lado),
        tipo: t.tipo,
        minuto: t.minuto,
      })),
      jugador_destacado_id: this.destacadoId(),
    };

    this.enviando.set(true);
    this._loadingService.show('Guardando acta y calculando puntos...');
    try {
      const resp = await firstValueFrom(this._partidosService.cerrarActa(payload));
      this._toastService.showSuccessToast(resp?.message || 'Acta guardada');
      this._modalCtrl.dismiss(resp, 'confirm');
    } catch (error) {
      const err = error as HttpErrorResponse;
      this._toastService.showErrorToast(err.error?.message || 'No se ha podido guardar el acta');
    } finally {
      this._loadingService.hide();
      this.enviando.set(false);
    }
  }

  cerrarModal() {
    this._modalCtrl.dismiss(null, 'cancel');
  }
}

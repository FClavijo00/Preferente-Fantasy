import { afterNextRender, Component, computed, ElementRef, inject, Injector, OnInit, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { calendarOutline, chevronForward, documentTextOutline, refreshOutline } from 'ionicons/icons';
import { JornadasService } from '../../../core/services/jornadas-service';
import { ActaPartidoComponent } from '../acta-partido/acta-partido.component';
import { opcionesModalAuto } from '../../../core/utils/modal-auto';

export interface Equipo {
  id: number;
  nombre: string;
  escudo_url: string;
  escudo: string;
}

export interface Partido {
  partido_id: number;
  fecha_partido: string | null;
  /** "YYYY-MM-DDTHH:mm" en hora de España (null si aún no tiene fecha) */
  fecha_local: string | null;
  goles_local: number | null;
  goles_visitante: number | null;
  local: Equipo;
  visitante: Equipo;
  jugado: boolean;
  tiene_acta: boolean;
  fecha: string;
  hora: string;
}

export type EstadoJornada = 'PENDIENTE' | 'EN_JUEGO' | 'CERRADA';

export interface Jornada {
  jornada_id: number;
  numero_jornada: number;
  jornada_estado: EstadoJornada;
  fecha_inicio: string | null;
  partidos: Partido[];
}

interface GrupoDia {
  /** "sábado, 25 oct" o "Sin fecha" */
  titulo: string;
  partidos: Partido[];
}

const TEXTO_ESTADO: Record<EstadoJornada, string> = {
  PENDIENTE: 'Pendiente',
  EN_JUEGO: 'En juego',
  CERRADA: 'Cerrada',
};

const FORMATO_DIA = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
const FORMATO_FECHA_COMPLETA = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Día de la semana en España: 1 = lunes ... 7 = domingo. */
function diaSemanaEspana(): number {
  const dia = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short' }).format(new Date());
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(dia) + 1;
}

/**
 * Jornada que se abre por defecto:
 * - De lunes a miércoles: la última cerrada (lo que interesa son los resultados).
 * - De jueves a domingo: la siguiente (la que está en juego o, si no, la próxima pendiente).
 * En ambos casos, si hay una en juego se abre esa (son los resultados más recientes).
 */
function jornadaPorDefecto(jornadas: Jornada[]): Jornada | null {
  if (jornadas.length === 0) return null;
  const enJuego = jornadas.find((j) => j.jornada_estado === 'EN_JUEGO');
  if (enJuego) return enJuego;

  const ultimaCerrada = [...jornadas].reverse().find((j) => j.jornada_estado === 'CERRADA');
  const siguiente = jornadas.find((j) => j.jornada_estado === 'PENDIENTE');

  const resultados = diaSemanaEspana() <= 3;
  return (resultados ? ultimaCerrada ?? siguiente : siguiente ?? ultimaCerrada) ?? jornadas[jornadas.length - 1];
}

/** Calendario de la competición real: partidos por jornada (pestaña "Partidos" del Inicio). */
@Component({
  selector: 'app-calendario',
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.scss'],
  imports: [IonIcon, IonSkeletonText],
})
export class CalendarioComponent implements OnInit {
  private _jornadasService = inject(JornadasService);
  private _modalCtrl = inject(ModalController);
  private _injector = inject(Injector);

  private readonly selectorRef = viewChild<ElementRef<HTMLElement>>('selector');

  readonly jornadas = signal<Jornada[]>([]);
  readonly jornadaId = signal<number | null>(null);
  readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');

  readonly textoEstado = TEXTO_ESTADO;

  readonly jornada = computed(() => this.jornadas().find((j) => j.jornada_id === this.jornadaId()) ?? null);

  /** La próxima jornada por jugar (la pendiente de menor número): es la única pendiente con badge. */
  readonly idSiguiente = computed(
    () => this.jornadas().find((j) => j.jornada_estado === 'PENDIENTE')?.jornada_id ?? null,
  );

  /** Partidos de la jornada agrupados por día (los que no tienen fecha, al final). */
  readonly grupos = computed<GrupoDia[]>(() => {
    const grupos: GrupoDia[] = [];
    for (const p of this.jornada()?.partidos ?? []) {
      const titulo = this.tituloDia(p.fecha_local);
      const ultimo = grupos.at(-1);
      if (ultimo && ultimo.titulo === titulo) ultimo.partidos.push(p);
      else grupos.push({ titulo, partidos: [p] });
    }
    return grupos;
  });

  constructor() {
    addIcons({ calendarOutline, chevronForward, documentTextOutline, refreshOutline });
  }

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    this.estado.set('cargando');
    try {
      const jornadas = (await firstValueFrom(this._jornadasService.getCalendario())) as unknown as Jornada[];
      this.jornadas.set(jornadas ?? []);
      this.estado.set('listo');
      const inicial = jornadaPorDefecto(this.jornadas());
      if (inicial) this.seleccionar(inicial.jornada_id, 'auto');
    } catch {
      this.estado.set('error');
    }
  }

  seleccionar(jornadaId: number, desplazamiento: ScrollBehavior = 'smooth') {
    this.jornadaId.set(jornadaId);
    // Centra el chip elegido en la barra de jornadas (cuando ya está pintado)
    afterNextRender(
      () => {
        const chip = this.selectorRef()?.nativeElement.querySelector<HTMLElement>(`[data-jornada="${jornadaId}"]`);
        chip?.scrollIntoView({ behavior: desplazamiento, inline: 'center', block: 'nearest' });
      },
      { injector: this._injector },
    );
  }

  /** En el centro del marcador: resultado si se jugó, la hora si está programado, o "VS". */
  centro(p: Partido): { tipo: 'resultado' | 'hora' | 'vs'; texto: string } {
    if (p.jugado && p.goles_local !== null && p.goles_visitante !== null) {
      return { tipo: 'resultado', texto: `${p.goles_local} - ${p.goles_visitante}` };
    }
    if (p.fecha_local) return { tipo: 'hora', texto: p.fecha_local.slice(11, 16) };
    return { tipo: 'vs', texto: 'VS' };
  }

  /**
   * Fecha de la tarjeta. Jugado: "dom, 25 oct 2026 · 17:00". Sin jugar: solo el día, porque
   * la hora ya va en el centro, entre los dos equipos. Sin fecha: "Fecha por confirmar".
   */
  fechaCompleta(p: Partido): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/.exec(p.fecha_local ?? '');
    if (!m) return 'Fecha por confirmar';
    const dia = FORMATO_FECHA_COMPLETA.format(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return this.centro(p).tipo === 'hora' ? dia : `${dia} · ${m[4]}`;
  }

  async abrirActa(p: Partido) {
    if (!p.tiene_acta) return;
    const modal = await this._modalCtrl.create({
      component: ActaPartidoComponent,
      ...opcionesModalAuto(),
      componentProps: { partidoId: p.partido_id },
    });
    await modal.present();
  }

  private tituloDia(fecha: string | null): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha ?? '');
    if (!m) return 'Sin fecha';
    return FORMATO_DIA.format(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  }
}

import { Component, input } from '@angular/core';

/** Partido tal cual lo devuelve jornadas/cargarPartidosJornada */
export interface PartidoMini {
  partido_id: number;
  equipo_local_id: number;
  equipo_visitante_id: number;
  local_nombre: string;
  local_escudo: string | null;
  visitante_nombre: string;
  visitante_escudo: string | null;
  /** Hora de España tal cual: "YYYY-MM-DDTHH:mm" */
  fecha_partido_local: string | null;
}

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Enfrentamientos de una jornada en una rejilla compacta (3 por fila), con día y hora.
 *
 *   <app-mini-calendario [partidos]="partidos()" />
 */
@Component({
  selector: 'app-mini-calendario',
  templateUrl: './mini-calendario.component.html',
  styleUrls: ['./mini-calendario.component.scss'],
})
export class MiniCalendarioComponent {
  readonly partidos = input.required<PartidoMini[]>();

  /** "Dom 15 · 20:00" (o null si no tiene fecha) */
  cuando(p: PartidoMini): string | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/.exec(p.fecha_partido_local ?? '');
    if (!m) return null;
    const dia = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getDay();
    return `${DIAS[dia]} ${Number(m[3])} · ${m[4]}`;
  }
}

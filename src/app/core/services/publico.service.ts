import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './ligas.service';

export interface EquipoPartidoPublico {
  id: number;
  nombre: string;
  escudo: string | null;
}

export interface PartidoPublico {
  id: number;
  /** Hora de España tal cual: 'YYYY-MM-DDTHH:MM' */
  fecha: string | null;
  jugado: boolean;
  local: EquipoPartidoPublico;
  visitante: EquipoPartidoPublico;
  goles_local: number | null;
  goles_visitante: number | null;
}

export interface FilaClasificacionPublica {
  posicion: number;
  posicion_anterior: number | null;
  equipo_id: number;
  equipo: string;
  escudo: string | null;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  san: number;
  puntos: number;
}

export interface JugadorPublico {
  id: number;
  nombre: string;
  posicion: 'POR' | 'DEF' | 'MED' | 'DEL';
  equipo: string;
  escudo: string | null;
  puntos: number;
  goles?: number;
  foto?: string | null;
}

export interface JornadaPublica {
  jornada: { numero: number; fecha_inicio: string; fecha_fin: string };
  /** Números de las jornadas publicadas (de la más reciente a la más antigua) */
  jornadas: number[];
  partidos: PartidoPublico[];
  clasificacion: FilaClasificacionPublica[];
  once_ideal: { formacion: string; jugadores: JugadorPublico[] };
  /** De la jornada (para el resumen): el que más puntuó y los que marcaron */
  mvp_jornada: JugadorPublico | null;
  goleadores_jornada: JugadorPublico[];
  /** Top 10 de la temporada hasta esta jornada (incluida) */
  ranking_puntos: JugadorPublico[];
  ranking_goleadores: JugadorPublico[];
  total_goles: number;
}

/** Datos abiertos (sin sesión) para las páginas públicas de la web. */
@Service()
export class PublicoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseURL}/publico`;

  /** Sin número: la última jornada publicada (la última con 11 ideal). */
  getJornada(numero?: number) {
    const url = numero ? `${this.apiUrl}/jornada/${numero}` : `${this.apiUrl}/jornada`;
    return this.http.get<ApiResponse<JornadaPublica>>(url);
  }
}

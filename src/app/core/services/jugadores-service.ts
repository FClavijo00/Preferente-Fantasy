import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';

interface ApiResponse<T> {
  ok: boolean;
  data: T;
}

/** Jugador tal como lo gestiona el panel de control (incluye inactivos). */
export interface JugadorAdmin {
  id: number;
  equipo_id: number;
  nombre: string;
  apellidos: string;
  apodo: string | null;
  posicion: 'POR' | 'DEF' | 'MED' | 'DEL';
  foto_url: string | null;
  /** URL firmada de la foto (o null) */
  foto: string | null;
  lesionado: boolean | null;
  activo: boolean | null;
  precio: number | null;
  /** Tiene partidos, puntos o alineaciones: no se puede borrar (solo desactivar). */
  tiene_historial: boolean;
}

/** Una jornada del historial de un jugador, con el partido de esa jornada. */
export interface JornadaJugador {
  jornada_id: number;
  numero_jornada: number;
  puntos: number;
  desglose: DesglosePuntos | null;
  en_casa: boolean;
  rival: string;
  goles_favor: number | null;
  goles_contra: number | null;
  jugado: boolean;
}

export interface ConceptoPuntos {
  concepto: string;
  puntos: number;
}

/** Desglose de puntos tal como lo guarda el acta (calcularPuntosJugador). */
export interface DesglosePuntos {
  participacion?: ConceptoPuntos | null;
  resultado?: ConceptoPuntos | null;
  goles?: ConceptoPuntos[];
  tarjetas?: ConceptoPuntos[];
  bonusEquipo?: ConceptoPuntos[];
  destacado?: ConceptoPuntos | null;
}

/** Detalle de un jugador para el modal (getDetalleJugador). */
export interface DetalleJugador {
  id: number;
  nombre: string;
  apellidos: string;
  apodo: string | null;
  posicion: 'POR' | 'DEF' | 'MED' | 'DEL';
  lesionado: boolean;
  activo: boolean;
  foto: string | null;
  equipo: { id: number; nombre: string; escudo: string | null };
  puntos_totales: number;
  jornadas_jugadas: number;
  media: number;
  posicion_ranking: number | null;
  /** Más reciente primero */
  historial: JornadaJugador[];
}

/** Fila del ranking (vista_ranking_puntos + foto y escudo firmados). */
export interface JugadorRanking {
  jugador_id: number;
  nombre: string;
  apellidos: string | null;
  apodo: string | null;
  posicion: string;
  equipo: string;
  equipo_id: number;
  foto: string | null;
  escudo: string | null;
  puntos_totales_temporada: number;
  jornadas_jugadas: number;
}

@Service()
export class JugadoresService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseURL}/jugadores`;

  getRanking(): Observable<JugadorRanking[]> {
    return this.http
      .get<ApiResponse<JugadorRanking[]>>(`${this.apiUrl}` + '/getRanking')
      .pipe(map((res) => res.data));
  }

  crearJugador(data: FormData) {
    return this.http.post(`${this.apiUrl}/crearJugador`, data);
  }

  editarJugador(data: FormData) {
    return this.http.post(`${this.apiUrl}/editarJugador`, data);
  }

  /** Panel de control: jugadores de un equipo (también inactivos), por posición y nombre. */
  getJugadoresEquipoAdmin(equipoId: number) {
    return this.http.post<ApiResponse<JugadorAdmin[]>>(`${this.apiUrl}/getJugadoresEquipoAdmin`, {
      equipo_id: equipoId,
    });
  }

  /** Detalle de un jugador (modal genérico: se abre con el id). */
  getDetalleJugador(jugadorId: number) {
    return this.http.post<ApiResponse<DetalleJugador>>(`${this.apiUrl}/getDetalleJugador`, { jugador_id: jugadorId });
  }

  /** Solo jugadores sin historial; si lo tienen, el backend responde 409. */
  eliminarJugador(id: number) {
    return this.http.post<ApiResponse<void> & { message?: string }>(`${this.apiUrl}/eliminarJugador`, { id });
  }

  getJugadores(posicion: string, idsExcluidos: number[]): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/getJugadores`, {
      posicion: posicion,
      idsExcluidos
    });
  }

  getJugadoresPorJornada(data: any) {
    return this.http.post(`${this.apiUrl}/getJugadoresPorJornada`, data);
  }
}

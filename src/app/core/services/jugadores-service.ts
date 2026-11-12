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

interface JugadorRanking {
  id: number;
  nombre: string;
  apellidos: string;
  apodo: string;
  posicion: string;
  foto_url: string;
  foto: string;
  equipo: string;
  partidos_jugados: number;
  partidos_titular: number;
  partidos_suplente: number;
  goles: number;
  tarjetas_amarillas: number;
  tarjetas_rojas: number;
  goles_en_propia: number;
  goles_penalti: number;
  goles_encajados: number;
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

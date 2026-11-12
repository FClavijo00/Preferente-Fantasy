import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message?: string;
}

export type Posicion = 'POR' | 'DEF' | 'MED' | 'DEL';
export type TipoGol = 'NORMAL' | 'PENALTI' | 'PROPIA';
/** AMARILLA = una amarilla · DOBLE AMARILLA = la segunda (expulsión) · ROJA = roja directa */
export type TipoTarjeta = 'AMARILLA' | 'DOBLE AMARILLA' | 'ROJA';

/** Jugador de uno de los dos equipos del partido (ordenados por posición y nombre). */
export interface JugadorActa {
  id: number;
  equipo_id: number;
  nombre: string;
  apellidos: string;
  apodo: string | null;
  posicion: Posicion;
}

/** Gol o tarjeta. En los goles en propia, equipo_id es el equipo que SUMA el gol. */
export interface EventoActa {
  jugador_id: number;
  equipo_id: number;
  tipo: string;
  /** Minuto del partido (0-130), opcional */
  minuto: number | null;
}

export interface ActaPartido {
  partido_id: number;
  titulares_local: number[];
  suplentes_local: number[];
  titulares_visitante: number[];
  suplentes_visitante: number[];
  goles_local: EventoActa[];
  goles_visitante: EventoActa[];
  tarjetas_local: EventoActa[];
  tarjetas_visitante: EventoActa[];
  jugador_destacado_id: number | null;
}

export interface PayloadActa {
  partido_id: number;
  titulares_local: number[];
  suplentes_local: number[];
  titulares_visitante: number[];
  suplentes_visitante: number[];
  goles: EventoActa[];
  tarjetas: EventoActa[];
  jugador_destacado_id: number | null;
}

@Service()
export class PartidosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseURL}/partidos`;

  crearPartido(data: any) {
    return this.http.post(`${this.apiUrl}/crearPartido`, data);
  }

  editarPartido(data: any) {
    return this.http.post(`${this.apiUrl}/editarPartido`, data);
  }

  /** Si el partido tiene acta, hay que confirmar que se borra (borrarActa = true). */
  eliminarPartido(partidoId: number, borrarActa: boolean) {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/eliminarPartido`, {
      partido_id: partidoId,
      borrar_acta: borrarActa,
    });
  }

  cerrarActa(payload: PayloadActa) {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/cerrarActa`, payload);
  }

  obtenerActa(partidoId: number) {
    return this.http.post<ActaPartido>(`${this.apiUrl}/obtenerActa`, { partido_id: partidoId });
  }

  /** Jugadores de los dos equipos del partido, para rellenar el acta (solo admin). */
  getJugadoresActa(partidoId: number) {
    return this.http.post<ApiResponse<{ local: JugadorActa[]; visitante: JugadorActa[] }>>(
      `${this.apiUrl}/getJugadoresActa`,
      { partido_id: partidoId },
    );
  }

  getActaPartidoPuntos(partidoId: number) {
    return this.http.post(`${this.apiUrl}/getActaPartidoPuntos`, { partido_id: partidoId });
  }
}

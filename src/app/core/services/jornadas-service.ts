import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import type { PartidoMini } from '../../shared/components/mini-calendario/mini-calendario.component';

interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message?: string;
}

export type EstadoJornada = 'PENDIENTE' | 'EN_JUEGO' | 'CERRADA';

/** Jornada tal como la ve el panel de control. Fechas en hora de España: "YYYY-MM-DDTHH:mm". */
/** Próxima jornada pendiente (jornadas/getSiguienteJornada). */
export interface SiguienteJornada {
  id: number;
  numero_jornada: number;
  estado: EstadoJornada;
  /** Hora de España tal cual: "YYYY-MM-DDTHH:mm". Es la hora de cierre de las alineaciones. */
  fecha_limite: string;
  /** Segundos que faltan para el cierre, calculados en el servidor (negativo si ya pasó) */
  segundos_restantes: number;
}

export interface JornadaAdmin {
  id: number;
  numero_jornada: number;
  estado: EstadoJornada;
  fecha_inicio: string;
  fecha_fin: string;
  num_partidos: number;
  num_alineaciones: number;
  tiene_once_ideal: boolean;
}

/** Jornada en la sección 11 ideal del panel (cerradas o con 11 ideal ya publicado). */
export interface JornadaOnceIdeal {
  id: number;
  numero_jornada: number;
  estado: EstadoJornada;
  once_ideal_id: number | null;
  formacion_id: number | null;
  formacion: string | null;
  /** Jugadores con puntos en la jornada (0 = aún no hay actas) */
  jugadores_puntuados: number;
}

export interface DatosJornada {
  numero_jornada: number;
  fecha_inicio: string;
  fecha_fin: string;
}

@Service()
export class JornadasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseURL}/jornadas`;

  getCalendario(): Observable<[]> {
    return this.http
      .get<ApiResponse<[]>>(`${this.apiUrl}` + '/getCalendarioJornadas')
      .pipe(map((res) => res.data));
  }

  getJornadaActual(): Observable<[]> {
    return this.http
      .get<ApiResponse<[]>>(`${this.apiUrl}` + '/getJornadaActual')
      .pipe(map((res) => res.data));
  }

  getSiguienteJornada(): Observable<SiguienteJornada> {
    return this.http
      .get<ApiResponse<SiguienteJornada>>(`${this.apiUrl}` + '/getSiguienteJornada')
      .pipe(map((res) => res.data));
  }

  getJornadas(): Observable<[]> {
    return this.http
      .get<ApiResponse<[]>>(`${this.apiUrl}` + '/getJornadas')
      .pipe(map((res) => res.data));
  }

  getPuntuacionesJornadas(data: any) {
    return this.http.post(`${this.apiUrl}/getPuntuacionesJornadas`, data);
  }

  getJornadasDisputadas() {
    return this.http.get(`${this.apiUrl}/getJornadasDisputadas`);
  }

  getJornadasOnceIdealAdmin() {
    return this.http.get<ApiResponse<JornadaOnceIdeal[]>>(`${this.apiUrl}/getJornadasOnceIdealAdmin`);
  }

  getJornadasOnceIdeal() {
    return this.http.get(`${this.apiUrl}/getJornadasOnceIdeal`);
  }

  /** Partidos de una jornada. Cada pantalla usa los campos que necesita (por defecto, los del mini calendario). */
  cargarPartidosJornada<T = PartidoMini>(jornada: number) {
    return this.http.post<ApiResponse<T[]>>(`${this.apiUrl}/cargarPartidosJornada`, { jornadaId: jornada });
  }

  cambiarEstadoJornada(data: { jornadaId: number; estado: EstadoJornada }) {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/cambiarEstadoJornada`, data);
  }

  // ---------- Panel de control (solo admin) ----------

  getJornadasAdmin() {
    return this.http.get<ApiResponse<JornadaAdmin[]>>(`${this.apiUrl}/getJornadasAdmin`);
  }

  crearJornada(data: DatosJornada) {
    return this.http.post<ApiResponse<{ id: number }>>(`${this.apiUrl}/crearJornada`, data);
  }

  editarJornada(data: DatosJornada & { id: number }) {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/editarJornada`, data);
  }

  eliminarJornada(id: number) {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/eliminarJornada`, { id });
  }
}

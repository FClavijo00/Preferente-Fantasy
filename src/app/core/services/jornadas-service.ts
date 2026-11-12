import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';

interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message?: string;
}

export type EstadoJornada = 'PENDIENTE' | 'EN_JUEGO' | 'CERRADA';

/** Jornada tal como la ve el panel de control. Fechas en hora de España: "YYYY-MM-DDTHH:mm". */
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

  getSiguienteJornada(): Observable<[]> {
    return this.http
      .get<ApiResponse<[]>>(`${this.apiUrl}` + '/getSiguienteJornada')
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

  cargarPartidosJornada(jornada: number) {
    return this.http.post(`${this.apiUrl}/cargarPartidosJornada`, {jornadaId: jornada});
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

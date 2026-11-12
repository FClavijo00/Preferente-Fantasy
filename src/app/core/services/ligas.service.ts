import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message?: string;
}

export interface Ligas {
  id: number;
  nombre_liga: string;
  privada: boolean;
  codigo_acceso: string | null;
  nombre_competicion: string;
  total_participantes: number;
  creado_por: number;
}

/** Liga pública en la que aún no estás (el backend no devuelve el creador). */
export type LigaAbierta = Omit<Ligas, 'creado_por'>;

/** Lo que devuelve crearLiga: lo justo para enseñar y compartir el código. */
export type LigaCreada = Pick<Ligas, 'id' | 'nombre_liga' | 'privada' | 'codigo_acceso'>;


@Service()
export class LigasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseURL}/ligas`;

  private readonly STORAGE_KEY = 'pf_liga_session';

  public ligaSeleccionada = signal<Ligas | null>(this.obtenerLigaSeleccionada());

  abandonarLiga(data: any) {
    return this.http.post(`${this.apiUrl}/abandonarLiga`, data);
  }

  eliminarLiga(data: any) {
    return this.http.post(`${this.apiUrl}/eliminarLiga`, data);
  }

  crearLiga(data: { nombre_campeonato: string; privado: boolean }) {
    return this.http.post<ApiResponse<LigaCreada>>(`${this.apiUrl}/crearLiga`, data);
  }

  getLigasAbiertas() {
    return this.http.get<ApiResponse<LigaAbierta[]>>(`${this.apiUrl}/getLigasAbiertas`);
  }

  getMisLigas() {
    return this.http.get<ApiResponse<Ligas[]>>(`${this.apiUrl}/getMisLigas`);
  }

  /** Por código (ligas privadas o públicas) o por id (solo públicas). */
  unirseALiga(data: { codigo: string } | { ligaId: number }) {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/unirseALiga`, data);
  }

  cargarUsuariosLiga(data: any) {
    return this.http.post(`${this.apiUrl}/cargarUsuariosLiga`, data);
  }

  eliminarUsuarioLiga(data: any) {
    return this.http.post(`${this.apiUrl}/eliminarUsuarioLiga`, data);
  }

  editarLiga(data: any) {
    return this.http.post(`${this.apiUrl}/editarLiga`, data);
  }

  private obtenerLigaSeleccionada(): Ligas | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  setLigaSeleccionada(liga: Ligas) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(liga));
    this.ligaSeleccionada.set(liga);
  }

  clearLigaSeleccionada() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.ligaSeleccionada.set(null);
  }
}

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

/** Lo que devuelve editarLiga. */
export type LigaEditada = LigaCreada;

/** Miembro de una liga (sin email). */
export interface MiembroLiga {
  usuario_id: number;
  nombre_usuario: string;
  nombre_club: string;
  image_url: string | null;
}


@Service()
export class LigasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseURL}/ligas`;

  private readonly STORAGE_KEY = 'pf_liga_session';

  public ligaSeleccionada = signal<Ligas | null>(this.obtenerLigaSeleccionada());

  /** Sales tú (el usuario sale del token). Si eres el único, la liga se borra; si eras el creador, pasa al siguiente. */
  abandonarLiga(ligaId: number) {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/abandonarLiga`, { liga_id: ligaId });
  }

  /** Solo el creador. */
  eliminarLiga(ligaId: number) {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/eliminarLiga`, { liga_id: ligaId });
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

  cargarUsuariosLiga(ligaId: number) {
    return this.http.post<ApiResponse<MiembroLiga[]>>(`${this.apiUrl}/cargarUsuariosLiga`, { liga_id: ligaId });
  }

  /** Solo el creador: expulsa a otro miembro. */
  eliminarUsuarioLiga(ligaId: number, usuarioId: number) {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/eliminarUsuarioLiga`, {
      liga_id: ligaId,
      user_id: usuarioId,
    });
  }

  /** Solo el creador. El código lo pone el servidor (nuevo_codigo: true genera otro). */
  editarLiga(data: { liga_id: number; nombre_liga: string; privada: boolean; nuevo_codigo?: boolean }) {
    return this.http.post<ApiResponse<LigaEditada>>(`${this.apiUrl}/editarLiga`, data);
  }

  /** Cambia datos de la liga seleccionada (p. ej. tras editarla) sin salir de ella. */
  actualizarLigaSeleccionada(cambios: Partial<Ligas>) {
    const actual = this.ligaSeleccionada();
    if (actual) this.setLigaSeleccionada({ ...actual, ...cambios });
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

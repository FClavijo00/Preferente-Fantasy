import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message?: string;
}

/** Sanción de puntos a un equipo (la clasificación resta la suma de las de cada equipo). */
export interface Sancion {
  id: number;
  equipo_id: number;
  equipo: string;
  escudo: string | null;
  /** Puntos que se restan */
  puntos: number;
  motivo: string | null;
  /** "YYYY-MM-DDTHH:mm" */
  creada: string;
}

export interface DatosSancion {
  equipo_id: number;
  puntos: number;
  motivo: string | null;
}

/** Panel de control: gestión de sanciones (solo admin). */
@Service()
export class SancionesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseURL}/sanciones`;

  getSanciones() {
    return this.http.get<ApiResponse<Sancion[]>>(`${this.apiUrl}/getSancionesAdmin`);
  }

  crearSancion(datos: DatosSancion) {
    return this.http.post<ApiResponse<{ id: number }>>(`${this.apiUrl}/crearSancion`, datos);
  }

  editarSancion(datos: DatosSancion & { id: number }) {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/editarSancion`, datos);
  }

  eliminarSancion(id: number) {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/eliminarSancion`, { id });
  }
}

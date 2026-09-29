import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  ok: boolean;
  data: T;
}

export interface Ligas {
  id: number;
  nombre_liga: string;
  privada: boolean;
  codigo_acceso: string | null;
  nombre_competicion: string;
  total_participantes: number;
}


@Service()
export class LigasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseURL}/ligas`;

  private readonly STORAGE_KEY = 'pf_liga_session';

  public ligaSeleccionada = signal<Ligas | null>(this.obtenerLigaSeleccionada());

  crearLiga(data: any) {
    return this.http.post(`${this.apiUrl}/crearLiga`, data);
  }

  getLigasAbiertas() {
    return this.http.get(`${this.apiUrl}/getLigasAbiertas`);
  }

  getMisLigas() {
    return this.http.get(`${this.apiUrl}/getMisLigas`);
  }

  unirseALiga(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/unirseALiga`, data);
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

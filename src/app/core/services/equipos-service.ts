import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';

export interface Equipo {
  id: number;
  nombre: string;
  escudo: string;
}

export interface Clasificacion {
  id: number;
  nombre: string;
  escudo_url: string;
  escudo: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  gd: number;
  pts: number;
  san: number;
}

interface ApiResponse<T> {
  ok: boolean;
  data: T;
}

@Service()
export class EquiposService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseURL}/equipos`;

  getClasificacion(): Observable<Clasificacion[]> {
    return this.http
      .get<ApiResponse<Clasificacion[]>>(`${this.apiUrl}` + '/getClasificacion')
      .pipe(map((res) => res.data));
  }

  getEquipos(): Observable<Equipo[]> {
    return this.http
      .get<ApiResponse<Equipo[]>>(`${this.apiUrl}` + '/getEquipos')
      .pipe(map((res) => res.data));
  }
}

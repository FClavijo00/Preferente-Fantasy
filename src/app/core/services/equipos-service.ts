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

/** Partido ya disputado, visto desde el equipo del detalle. */
export interface PartidoEquipo {
  partido_id: number;
  numero_jornada: number;
  /** "YYYY-MM-DDTHH:mm", hora de España tal cual */
  fecha_local: string | null;
  en_casa: boolean;
  rival_id: number;
  rival: string;
  rival_escudo: string | null;
  goles_favor: number;
  goles_contra: number;
  resultado: 'V' | 'E' | 'D';
  tiene_acta: boolean;
}

/** Detalle de un equipo para el modal (getDetalleEquipo). */
export interface DetalleEquipo {
  id: number;
  nombre: string;
  siglas: string | null;
  escudo: string | null;
  color_primario: string | null;
  color_secundario: string | null;
  estadio: string | null;
  estadio_lat: number | null;
  estadio_lng: number | null;
  clasificacion: {
    posicion: number;
    pj: number;
    pts: number;
    g: number;
    e: number;
    p: number;
    gf: number;
    gc: number;
    dg: number;
    /** Puntos restados por sanciones */
    san: number;
  } | null;
  /** Más reciente primero */
  partidos: PartidoEquipo[];
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

  getDetalleEquipo(equipoId: number) {
    return this.http.post<ApiResponse<DetalleEquipo>>(`${this.apiUrl}/getDetalleEquipo`, { equipo_id: equipoId });
  }

  getEquiposLimpios() {
    return this.http.get(`${this.apiUrl}/getEquiposLimpios`);
  }
}

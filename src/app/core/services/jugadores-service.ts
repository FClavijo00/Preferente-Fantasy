import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';

interface ApiResponse<T> {
  ok: boolean;
  data: T;
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
}

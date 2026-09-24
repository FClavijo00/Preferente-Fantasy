import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  ok: boolean;
  data: T;
}

interface Ligas {
  id: number;
  nombre: string;
}

@Service()
export class LigasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseURL}/ligas`;

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
}

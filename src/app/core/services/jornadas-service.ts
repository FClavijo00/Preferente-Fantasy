import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';

interface ApiResponse<T> {
  ok: boolean;
  data: T;
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
}

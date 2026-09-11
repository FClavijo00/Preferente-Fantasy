import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

interface ApiResponse<T> {
  ok: boolean;
  data: T;
}

interface Usuario {
  id: string;
  email: string;
  nombre_usuario: string;
  nombre_club: string;
  image_url: string;
  image: string;
  rol_id: number;
}

@Service()
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseURL}/auth`;

  login(email: string, password: string) {
    return this.http.post<ApiResponse<Usuario>>(`${this.apiUrl}/login`, {
      email,
      password,
    });
  }

  register(data: any) {
    return this.http.post<ApiResponse<Usuario>>(
      `${this.apiUrl}/register`,
      data,
    );
  }
}

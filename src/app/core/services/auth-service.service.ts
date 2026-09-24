import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable, tap } from 'rxjs';
import { NavController } from '@ionic/angular';

interface ApiResponse<T> {
  ok: boolean;
  data: T;
}

interface Usuario {
  id: number;
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
  private _navCtrl = inject(NavController);
  private apiUrl = `${environment.apiBaseURL}/auth`;

  private readonly STORAGE_KEY = 'pf_user_session';

  public currentUser = signal<Usuario | null>(this.obtenerUsuarioInicial());

  private obtenerUsuarioInicial(): Usuario | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  // Guardar la sesión de forma síncrona en memoria y almacenamiento
  setSession(user: Usuario, token?: string) {
    if (token) {
      localStorage.setItem('pf_token', token);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    this.currentUser.set(user); // Actualiza la Signal inmediatamente
  }

  // Cerrar sesión limpiando todo
  clearSession() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('pf_token');
    this.currentUser.set(null);
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  login(email: string, password: string) {
    return this.http.post<ApiResponse<Usuario>>(`${this.apiUrl}/login`, {email, password});
  }

  getUser(): Usuario | null {
    return this.currentUser();
  }

  logout() {
    this.clearSession();
    this._navCtrl.navigateRoot(['/login'], { replaceUrl: true });
  }

  private getUserFromStorage(): Usuario | null {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  }

  setCurrentUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  register(data: any) {
    return this.http.post<ApiResponse<Usuario>>(
      `${this.apiUrl}/register`,
      data,
    );
  }
}

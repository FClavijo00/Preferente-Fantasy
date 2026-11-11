import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NavController } from '@ionic/angular/nav-controller';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message?: string;
}

export interface Usuario {
  id: number;
  email: string;
  nombre_usuario: string;
  nombre_club: string;
  image_url: string;
  image: string;
  rol_id: number;
}

interface LoginData {
  token: string;
  usuario: Usuario;
}

const USER_KEY = 'pf_user_session';
const TOKEN_KEY = 'pf_token';

@Service()
export class AuthService {
  private http = inject(HttpClient);
  private _navCtrl = inject(NavController);
  private apiUrl = `${environment.apiBaseURL}/auth`;

  public currentUser = signal<Usuario | null>(this.leerUsuarioGuardado());

  private leerUsuarioGuardado(): Usuario | null {
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Guarda la sesión en memoria (signal) y en localStorage.
   * Sin token solo actualiza los datos del usuario (p. ej. tras editar el perfil).
   */
  setSession(user: Usuario, token?: string) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  clearSession() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    this.currentUser.set(null);
  }

  /** Hay sesión si tenemos usuario y un token que no ha caducado. */
  isAuthenticated(): boolean {
    return this.currentUser() !== null && !this.tokenCaducado();
  }

  /**
   * Lee la fecha de caducidad (exp) del token. No valida la firma (eso lo hace el
   * backend); solo sirve para no dar por buena una sesión que el servidor ya rechaza.
   */
  tokenCaducado(): boolean {
    const token = this.getToken();
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  getUser(): Usuario | null {
    return this.currentUser();
  }

  login(email: string, password: string) {
    return this.http.post<ApiResponse<LoginData>>(`${this.apiUrl}/login`, { email, password });
  }

  /** Hace login y deja la sesión guardada. Lanza el HttpErrorResponse si falla. */
  async iniciarSesion(email: string, password: string): Promise<Usuario> {
    const resp = await firstValueFrom(this.login(email, password));
    this.clearSession();
    this.setSession(resp.data.usuario, resp.data.token);
    return resp.data.usuario;
  }

  logout() {
    this.clearSession();
    this._navCtrl.navigateRoot(['/login'], { replaceUrl: true });
  }

  register(data: FormData) {
    return this.http.post<ApiResponse<Usuario>>(`${this.apiUrl}/register`, data);
  }

  cambiarPass(data: { passwordActual: string; passwordNueva: string }) {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/cambiarPassword`, data);
  }

  actualizarPerfil(data: FormData) {
    return this.http.post<ApiResponse<Usuario>>(`${this.apiUrl}/actualizarUsuario`, data);
  }

  eliminarCuenta(password: string) {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/eliminarCuenta`, { password });
  }

  /** Perfil del usuario de la sesión (el backend lo saca del token). */
  cargarPerfil() {
    return this.http.post<ApiResponse<Usuario>>(`${this.apiUrl}/cargarPerfil`, {});
  }
}

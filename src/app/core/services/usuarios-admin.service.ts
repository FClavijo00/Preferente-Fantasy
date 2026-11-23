import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './ligas.service';

export interface UsuarioAdmin {
  id: number;
  email: string;
  nombre_usuario: string;
  nombre_club: string;
  created_at: string;
  rol_id: number;
  /** En cuántas ligas está */
  ligas: number;
}

/** Panel de control → Usuarios (solo admin). */
@Service()
export class UsuariosAdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseURL}/auth`;

  /** Por correo, nombre de usuario o club (mínimo 2 letras, máximo 20 resultados) */
  buscar(texto: string) {
    return this.http.post<ApiResponse<UsuarioAdmin[]>>(`${this.apiUrl}/buscarUsuariosAdmin`, { texto });
  }

  /** Pone una contraseña temporal aleatoria y la devuelve (solo esta vez) */
  restablecerPassword(usuarioId: number) {
    return this.http.post<ApiResponse<{ usuario_id: number; password_temporal: string }>>(
      `${this.apiUrl}/restablecerPasswordAdmin`,
      { usuario_id: usuarioId },
    );
  }
}

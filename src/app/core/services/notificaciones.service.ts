import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { detectarDispositivo, estaInstalada } from '../utils/instalar-app';

interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message?: string;
}

/** Tipos de notificación que cada usuario puede activar o desactivar */
export interface PreferenciasNotificaciones {
  actas: boolean;
  recordatorios: boolean;
  once_ideal: boolean;
  avisos: boolean;
}

/** Fila del historial del panel */
export interface AvisoEnviado {
  id: number;
  tipo: string;
  titulo: string | null;
  cuerpo: string | null;
  destinatarios: number;
  created_at: string;
}

/**
 * - 'si': se pueden activar en este navegador.
 * - 'instalar': iPhone/iPad desde Safari: solo funcionan con la app añadida a la pantalla de inicio.
 * - 'no': el navegador no las admite.
 */
export type SoportePush = 'si' | 'instalar' | 'no';

/** 'activadas' | 'desactivadas' | 'bloqueadas' (el usuario las denegó en el navegador) */
export type EstadoPush = 'activadas' | 'desactivadas' | 'bloqueadas';

const SW_URL = '/sw-push.js';
const CLAVE_OFRECIDO = 'pf_push_ofrecido';

/** Clave VAPID (base64url) al formato que pide pushManager.subscribe */
const aUint8Array = (base64: string): Uint8Array<ArrayBuffer> => {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + relleno).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

/**
 * Notificaciones push (Web Push). El service worker (src/sw-push.js) las enseña y abre la app al pulsar.
 * El servidor decide qué enviar (actas, cierre de jornada, 11 ideal, avisos del panel).
 */
@Service()
export class NotificacionesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseURL}/notificaciones`;

  /** Estado en este dispositivo (se refresca con comprobarEstado) */
  readonly estado = signal<EstadoPush>('desactivadas');

  soporte(): SoportePush {
    const hayApi = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    if (hayApi) return 'si';
    // En el iPhone el API solo existe con la app instalada (iOS 16.4+)
    if (detectarDispositivo() === 'ios' && !estaInstalada()) return 'instalar';
    return 'no';
  }

  private async registro(): Promise<ServiceWorkerRegistration> {
    const actual = await navigator.serviceWorker.getRegistration(SW_URL);
    return actual ?? navigator.serviceWorker.register(SW_URL, { scope: '/' });
  }

  private async suscripcionActual(): Promise<PushSubscription | null> {
    if (this.soporte() !== 'si') return null;
    const reg = await navigator.serviceWorker.getRegistration(SW_URL);
    return (await reg?.pushManager.getSubscription()) ?? null;
  }

  async comprobarEstado(): Promise<EstadoPush> {
    let estado: EstadoPush = 'desactivadas';
    if (this.soporte() === 'si') {
      if (Notification.permission === 'denied') estado = 'bloqueadas';
      else if (Notification.permission === 'granted' && (await this.suscripcionActual())) estado = 'activadas';
    }
    this.estado.set(estado);
    return estado;
  }

  /**
   * Pide permiso (tiene que ser tras pulsar un botón: iPhone no deja pedirlo solo),
   * suscribe este navegador y se lo manda al servidor.
   */
  async activar(): Promise<EstadoPush> {
    if (this.soporte() !== 'si') throw new Error('Este navegador no admite notificaciones.');

    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') return this.comprobarEstado();

    const clave = (await firstValueFrom(this.http.get<ApiResponse<{ clave: string | null }>>(`${this.apiUrl}/getClavePublica`)))
      .data.clave;
    if (!clave) throw new Error('Las notificaciones aún no están disponibles en el servidor.');

    const reg = await this.registro();
    await navigator.serviceWorker.ready;
    const suscripcion =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aUint8Array(clave) }));

    await firstValueFrom(this.http.post(`${this.apiUrl}/suscribir`, { suscripcion: suscripcion.toJSON() }));
    this.marcarOfrecido();
    return this.comprobarEstado();
  }

  /** Deja de recibirlas en este dispositivo (en los demás siguen). */
  async desactivar(): Promise<EstadoPush> {
    const suscripcion = await this.suscripcionActual();
    if (suscripcion) {
      await firstValueFrom(this.http.post(`${this.apiUrl}/desuscribir`, { endpoint: suscripcion.endpoint })).catch(
        () => undefined,
      );
      await suscripcion.unsubscribe().catch(() => undefined);
    }
    return this.comprobarEstado();
  }

  /**
   * Al entrar en la app: si este navegador ya está suscrito, se vuelve a mandar al servidor
   * (el navegador puede renovar la suscripción, o haber cambiado de cuenta).
   */
  async sincronizar() {
    try {
      if (this.soporte() !== 'si' || Notification.permission !== 'granted') {
        await this.comprobarEstado();
        return;
      }
      // Asegura que el service worker sigue registrado (p. ej. tras borrar datos)
      await this.registro();
      const suscripcion = await this.suscripcionActual();
      if (suscripcion) {
        await firstValueFrom(this.http.post(`${this.apiUrl}/suscribir`, { suscripcion: suscripcion.toJSON() }));
      }
      await this.comprobarEstado();
    } catch {
      // Sin red o sin servidor: no es grave, se reintenta la próxima vez
    }
  }

  /** Al cerrar sesión: este dispositivo deja de recibir las de esta cuenta. */
  async desvincular() {
    try {
      const suscripcion = await this.suscripcionActual();
      if (suscripcion) {
        await firstValueFrom(this.http.post(`${this.apiUrl}/desuscribir`, { endpoint: suscripcion.endpoint }));
      }
    } catch {
      // Si falla, el servidor la reasigna cuando entre otra cuenta en este navegador
    }
  }

  // ---------- Aviso de la primera vez (recepción) ----------

  /** ¿Hay que ofrecerlas al entrar? Solo una vez por dispositivo y si aún no se han decidido. */
  debeOfrecer(): boolean {
    try {
      if (localStorage.getItem(CLAVE_OFRECIDO)) return false;
    } catch {
      return false;
    }
    const soporte = this.soporte();
    if (soporte === 'instalar') return true;
    return soporte === 'si' && Notification.permission === 'default';
  }

  marcarOfrecido() {
    try {
      localStorage.setItem(CLAVE_OFRECIDO, new Date().toISOString());
    } catch {
      // Sin almacenamiento (modo privado): se volverá a ofrecer, no pasa nada
    }
  }

  // ---------- Servidor ----------

  getPreferencias() {
    return this.http.get<ApiResponse<PreferenciasNotificaciones>>(`${this.apiUrl}/getPreferencias`);
  }

  guardarPreferencias(p: PreferenciasNotificaciones) {
    return this.http.post<ApiResponse<PreferenciasNotificaciones>>(`${this.apiUrl}/guardarPreferencias`, p);
  }

  enviarPrueba() {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/enviarPrueba`, {});
  }

  // Panel de control
  enviarAviso(datos: { titulo: string; mensaje: string; url?: string }) {
    return this.http.post<ApiResponse<{ entregadas: number }>>(`${this.apiUrl}/enviarAviso`, datos);
  }

  getHistorialAvisos() {
    return this.http.get<
      ApiResponse<{ historial: AvisoEnviado[]; dispositivos: number; usuarios: number; configurado: boolean }>
    >(`${this.apiUrl}/getHistorialAvisos`);
  }
}

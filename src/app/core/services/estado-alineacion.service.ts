import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface EstadoAlineacionesApi {
  jornada: { id: number; numero_jornada: number; fecha_limite: string; segundos_restantes: number } | null;
  ligas: { liga_id: number; jugadores: number }[];
}

/**
 * - hecha: los 11 jugadores guardados
 * - incompleta: guardada con menos de 11
 * - pendiente: sin hacer y queda más de un día
 * - urgente: sin hacer (o incompleta) y queda menos de un día
 * Pasada la hora límite no hay aviso: la jornada ya está en juego.
 */
export type NivelAlineacion = 'hecha' | 'incompleta' | 'pendiente' | 'urgente';

export interface AvisoAlineacion {
  nivel: NivelAlineacion;
  /** Texto corto para un badge: "Sin alineación", "Cierra en 5 h", "Alineada"... */
  texto: string;
  numeroJornada: number;
}

const JUGADORES = 11;
const UN_DIA = 24 * 60 * 60 * 1000;

/**
 * Estado de las alineaciones del usuario para la próxima jornada, en todas sus ligas.
 * Lo usan la barra de pestañas (punto en "Alineación") y la recepción (badge en cada liga).
 */
@Service()
export class EstadoAlineacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseURL}/alineaciones`;

  private readonly datos = signal<EstadoAlineacionesApi | null>(null);
  /** Momento (ms) en que cierra la jornada, según el reloj del dispositivo. */
  private readonly cierre = signal<number | null>(null);
  /** Se actualiza cada minuto para que "Cierra en..." vaya cambiando solo. */
  private readonly ahora = signal(Date.now());

  constructor() {
    const reloj = setInterval(() => this.ahora.set(Date.now()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(reloj));
  }

  /** Recarga el estado. Si falla, se dejan de mostrar avisos (no es crítico). */
  async cargar() {
    try {
      const res = await firstValueFrom(
        this.http.get<{ ok: boolean; data: EstadoAlineacionesApi }>(`${this.apiUrl}/getEstadoAlineaciones`),
      );
      this.datos.set(res.data);
      // El servidor da los segundos que faltan (en hora de España): no dependemos de la zona del móvil
      this.cierre.set(res.data.jornada ? Date.now() + res.data.jornada.segundos_restantes * 1000 : null);
      this.ahora.set(Date.now());
    } catch {
      this.datos.set(null);
      this.cierre.set(null);
    }
  }

  /** Aviso de una liga, o null si no hay jornada pendiente o no hay datos. */
  aviso(ligaId: number | null | undefined): AvisoAlineacion | null {
    const datos = this.datos();
    const cierre = this.cierre();
    if (!datos?.jornada || cierre === null || ligaId == null) return null;

    // Pasada la hora límite la jornada ya está en juego: no se avisa de nada
    const restante = cierre - this.ahora();
    if (restante <= 0) return null;

    const liga = datos.ligas.find((l) => l.liga_id === ligaId);
    const jugadores = liga?.jugadores ?? 0;
    const numeroJornada = datos.jornada.numero_jornada;

    if (jugadores >= JUGADORES) return { nivel: 'hecha', texto: 'Alineada', numeroJornada };

    if (restante < UN_DIA) return { nivel: 'urgente', texto: this.textoCierre(restante), numeroJornada };
    if (jugadores > 0) return { nivel: 'incompleta', texto: `Incompleta (${jugadores}/11)`, numeroJornada };
    return { nivel: 'pendiente', texto: 'Sin alineación', numeroJornada };
  }

  private textoCierre(ms: number): string {
    const minutos = Math.ceil(ms / 60_000);
    if (minutos < 60) return `Cierra en ${minutos} min`;
    return `Cierra en ${Math.floor(minutos / 60)} h`;
  }
}

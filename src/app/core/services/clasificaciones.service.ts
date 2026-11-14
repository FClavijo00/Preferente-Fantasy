import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Resumen de la última jornada cerrada jugada en una liga (bloque del Inicio). */
export interface ResumenUltimaJornada {
    jornada: { id: number; numero_jornada: number } | null;
    participantes?: number;
    /** null si el usuario no alineó en esa jornada */
    mis_puntos?: number | null;
    mi_posicion?: number | null;
    mejor?: { nombre_club: string; puntos: number; soy_yo: boolean } | null;
}

/** Fila de una clasificación de la liga (general o de una jornada). */
export interface FilaClasificacionLiga {
    usuario_id: number;
    nombre_usuario: string;
    nombre_club: string;
    image_url: string | null;
    puntos_totales: number;
    /** Con empates (RANK): dos primeros = 1, 1, 3 */
    posicion: number;
    /** Solo en la general: puestos subidos (+) o bajados (-) con la última jornada; null si no hay con qué comparar */
    movimiento?: number | null;
}

/** Jornada en juego o cerrada en la que la liga tiene alineaciones. */
export interface JornadaLiga {
    id: number;
    numero_jornada: number;
    estado: 'EN_JUEGO' | 'CERRADA';
    tiene_once_ideal: boolean;
}

@Service()
export class ClasificacionesService {

    private http = inject(HttpClient)
    private apiUrl = `${environment.apiBaseURL}/clasificaciones`

    /** Clasificación general de la liga, con lo que ha subido o bajado cada uno. */
    getClasificacion(ligaId: number) {
        return this.http.post<{ ok: boolean; data: FilaClasificacionLiga[] }>(`${this.apiUrl}/getClasificacionLiga`, {
            liga_id: ligaId,
        });
    }

    /** Clasificación de una jornada (solo quienes alinearon). */
    getClasificacionPorJornada(ligaId: number, jornadaId: number) {
        return this.http.post<{ ok: boolean; data: FilaClasificacionLiga[] }>(`${this.apiUrl}/getClasificacionPorJornada`, {
            liga_id: ligaId,
            jornada_id: jornadaId,
        });
    }

    /** Jornadas en juego o cerradas con alineaciones en la liga (más reciente primero). */
    getJornadasLiga(ligaId: number) {
        return this.http.post<{ ok: boolean; data: JornadaLiga[] }>(`${this.apiUrl}/getJornadasLiga`, { liga_id: ligaId });
    }

    getResumenUltimaJornada(ligaId: number) {
        return this.http.post<{ ok: boolean; data: ResumenUltimaJornada }>(
            `${this.apiUrl}/getResumenUltimaJornada`,
            { liga_id: ligaId },
        );
    }
  
}

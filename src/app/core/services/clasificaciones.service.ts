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

@Service()
export class ClasificacionesService {

    private http = inject(HttpClient)
    private apiUrl = `${environment.apiBaseURL}/clasificaciones`

    getClasificacion(data: any) {
        return this.http.post(`${this.apiUrl}/getClasificacionLiga`, data);
    }

    getClasificacionPorJornada(data: any) {
        return this.http.post(`${this.apiUrl}/getClasificacionPorJornada`, data);
    }

    getResumenUltimaJornada(ligaId: number) {
        return this.http.post<{ ok: boolean; data: ResumenUltimaJornada }>(
            `${this.apiUrl}/getResumenUltimaJornada`,
            { liga_id: ligaId },
        );
    }
  
}

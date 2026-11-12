import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';

@Service()
export class AlineacionesService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiBaseURL}/alineaciones`;

    cargarAlineacion(data: any) {
        return this.http.post(`${this.apiUrl}/cargarAlineacion`, data);
    }

    cargarAlineacionesJornadas(data: any) {
        return this.http.post(`${this.apiUrl}/cargarAlineacionesJornadas`, data);
    }

    guardarAlineacion(payload: any) {
        return this.http.post(`${this.apiUrl}/guardarAlineacion`, payload);
    }

    cargarOnceIdeal(jornadaID: number) {
        return this.http.post(`${this.apiUrl}/cargarOnceIdeal`, { jornada_id: jornadaID });
    }

    /** Crea o actualiza el 11 ideal de una jornada (solo admin). */
    guardarOnceIdeal(payload: { jornada_id: number; formacion_id: number; jugadores: { jugador_id: number; hueco_index: number }[] }) {
        return this.http.post<{ ok: boolean; message?: string }>(`${this.apiUrl}/guardarOnceIdeal`, payload);
    }

    /** Elimina el 11 ideal de una jornada (solo admin). */
    eliminarOnceIdeal(jornadaId: number) {
        return this.http.post<{ ok: boolean; message?: string }>(`${this.apiUrl}/eliminarOnceIdeal`, { jornada_id: jornadaId });
    }
}

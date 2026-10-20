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

    guardarOnceIdeal(payload: any) {
        return this.http.post(`${this.apiUrl}/guardarOnceIdeal`, payload);
    }
}

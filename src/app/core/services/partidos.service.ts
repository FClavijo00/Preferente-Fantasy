import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';

@Service()
export class PartidosService {

    private http = inject(HttpClient);
    private apiUrl = `${environment.apiBaseURL}/partidos`;

    crearPartido(data: any) {
        return this.http.post(`${this.apiUrl}/crearPartido`, data);
    }

    editarPartido(data: any) {
        return this.http.post(`${this.apiUrl}/editarPartido`, data);
    }

    cerrarActa(payload: any) {
        return this.http.post(`${this.apiUrl}/cerrarActa`, payload);
    }

    obtenerActa(partidoId: number) {
        return this.http.post(`${this.apiUrl}/obtenerActa`, { partido_id: partidoId });
    }

}

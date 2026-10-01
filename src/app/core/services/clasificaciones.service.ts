import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';

@Service()
export class ClasificacionesService {

    private http = inject(HttpClient)
    private apiUrl = `${environment.apiBaseURL}/clasificaciones`

    getClasificacion(data: any) {
        return this.http.post(`${this.apiUrl}/getClasificacionLiga`, data);
    }
  
}

import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

@Service()
export class FormacionesService {

    private http = inject(HttpClient);
    private apiUrl = `${environment.apiBaseURL}/formaciones`;

    getFormaciones() {
        return this.http.get(`${this.apiUrl}` + '/getFormaciones');
    }

}

import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';

export type RolHueco = 'POR' | 'DEF' | 'MED' | 'DEL';

/** Jugador guardado en un hueco de la alineación del usuario (cargarAlineacion). */
export interface JugadorPlantilla {
    hueco_index: number;
    posicion: RolHueco;
    id: number;
    nombre: string;
    apellidos: string | null;
    apodo: string | null;
    foto: string | null;
    lesionado: boolean | null;
    activo: boolean | null;
    equipo_id: number;
    equipo_nombre: string;
    equipo_escudo: string | null;
}

export interface PlantillaUsuario {
    /** false si no hay nada guardado para la jornada (o si es la propuesta de una anterior) */
    existe: boolean;
    /** Con "anterior": número de la jornada de la que se ha copiado la propuesta */
    de_jornada?: number | null;
    formacion_id: number;
    jugadores: JugadorPlantilla[];
}

export interface PayloadAlineacion {
    liga_id: number;
    jornada_id: number;
    formacion_id: number;
    jugadores: { jugador_id: number; posicion: RolHueco; hueco_index: number }[];
}

@Service()
export class AlineacionesService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiBaseURL}/alineaciones`;

    /**
     * Alineación de un usuario en una jornada. Con anterior = true (solo la tuya), si aún no hay
     * nada guardado devuelve la última de una jornada anterior, sin guardarla (existe = false).
     */
    cargarAlineacion(data: { liga_id: number; usuario_id: number; jornada_id: number; anterior?: boolean }) {
        return this.http.post<PlantillaUsuario>(`${this.apiUrl}/cargarAlineacion`, data);
    }

    cargarAlineacionesJornadas(data: any) {
        return this.http.post(`${this.apiUrl}/cargarAlineacionesJornadas`, data);
    }

    /** El backend valida la hora de cierre y el once (409 si la jornada ya empezó, 400 si no es válido). */
    guardarAlineacion(payload: PayloadAlineacion) {
        return this.http.post<{ ok: boolean; mensaje?: string }>(`${this.apiUrl}/guardarAlineacion`, payload);
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

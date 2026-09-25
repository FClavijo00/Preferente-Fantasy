import { Service, signal } from '@angular/core';

@Service()
export class LoadingService {

    // Signal para controlar la visibilidad del loader
    isLoading = signal<boolean>(false);

    // Signal opcional para mostrar un texto dinámico (ej: "Procesando acta...")
    mensaje = signal<string>('Cargando...');

    /**
     * Muestra el pantalla completa de carga
     * @param mensajeTexto Mensaje opcional a mostrar en pantalla
     */
    show(mensajeTexto: string = 'Cargando...') {
        this.mensaje.set(mensajeTexto);
        this.isLoading.set(true);
    }

    /**
     * Oculta la pantalla de carga
     */
    hide() {
        this.isLoading.set(false);
    }

}

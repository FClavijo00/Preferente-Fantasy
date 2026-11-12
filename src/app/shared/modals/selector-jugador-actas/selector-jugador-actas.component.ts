import { Component, computed, inject, Input, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeOutline, removeCircleOutline, searchOutline } from 'ionicons/icons';
import { JugadorActa, Posicion } from '../../../core/services/partidos.service';

export interface GrupoJugadores {
  posicion: Posicion;
  titulo: string;
  jugadores: JugadorActa[];
}

/** Resultado al cerrar con role 'confirm': el id elegido, o null si se vacía el hueco. */
export type SeleccionJugador = number | null;

/** Minúsculas y sin tildes, para buscar "nunez" y encontrar "Núñez". */
const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/**
 * Selector de jugador del acta de partido (solo se usa ahí): buscador + jugadores agrupados por posición.
 * Se abre con opcionesModalAuto() (sheet en el móvil, tarjeta en el escritorio).
 */
@Component({
  selector: 'app-selector-jugador-actas',
  templateUrl: './selector-jugador-actas.component.html',
  styleUrls: ['./selector-jugador-actas.component.scss'],
  imports: [IonIcon],
})
export class SelectorJugadorActasComponent {
  // Los pasa quien abre el modal con componentProps
  @Input() titulo = 'Elegir jugador';
  @Input() subtitulo = '';
  @Input() grupos: GrupoJugadores[] = [];
  @Input() seleccionado: number | null = null;
  /** Ids que no se pueden elegir (p. ej. ya convocados en otro hueco). */
  @Input() ocupados: number[] = [];
  @Input() textoOcupado = 'Ya convocado';
  /** Muestra la opción de dejar el hueco vacío. */
  @Input() permitirVacio = true;
  @Input() textoVacio = 'Dejar vacío';
  @Input() mensajeSinJugadores = 'No hay jugadores disponibles.';

  private _modalCtrl = inject(ModalController);

  readonly busqueda = signal('');

  readonly gruposFiltrados = computed(() => {
    const texto = normalizar(this.busqueda());
    if (!texto) return this.grupos;
    return this.grupos
      .map((g) => ({ ...g, jugadores: g.jugadores.filter((j) => normalizar(this.nombre(j) + ' ' + j.nombre + ' ' + j.apellidos).includes(texto)) }))
      .filter((g) => g.jugadores.length > 0);
  });

  readonly total = computed(() => this.grupos.reduce((n, g) => n + g.jugadores.length, 0));

  constructor() {
    addIcons({ checkmarkCircle, closeOutline, removeCircleOutline, searchOutline });
  }

  nombre(j: JugadorActa): string {
    return j.apodo?.trim() || `${j.nombre} ${j.apellidos ?? ''}`.trim();
  }

  /** Nombre completo como segunda línea, solo si el jugador se muestra por su apodo. */
  nombreCompleto(j: JugadorActa): string | null {
    return j.apodo?.trim() ? `${j.nombre} ${j.apellidos ?? ''}`.trim() : null;
  }

  estaOcupado(id: number): boolean {
    return id !== this.seleccionado && this.ocupados.includes(id);
  }

  elegir(id: SeleccionJugador) {
    this._modalCtrl.dismiss(id, 'confirm');
  }

  cerrar() {
    this._modalCtrl.dismiss(null, 'cancel');
  }
}

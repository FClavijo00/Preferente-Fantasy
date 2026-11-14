import { Component, inject, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { closeOutline, medkitOutline } from 'ionicons/icons';
import { AvatarJugadorComponent } from '../../components/avatar-jugador/avatar-jugador.component';

interface Concepto {
  concepto: string;
  puntos: number;
}

/** Lo mínimo que necesita el modal (llega del acta, de la clasificación o del 11 ideal). */
export interface JugadorPuntosJornada {
  nombre: string;
  apellidos?: string | null;
  apodo?: string | null;
  posicion: string;
  foto?: string | null;
  /** Escudo del equipo con el que jugó (equipo_escudo o escudo, según quién lo abra) */
  equipo_escudo?: string | null;
  escudo?: string | null;
  lesionado?: boolean | null;
  puntos_jornada: number;
  desglose?: unknown;
}

/**
 * Puntos de un jugador en UNA jornada, con su desglose. Mismo diseño que el detalle del jugador
 * (modal centrado con el botón de cerrar flotante).
 *
 *   modalCtrl.create({ component: DetalleJugadorJornadaComponent, cssClass: 'card-modal-center',
 *                      componentProps: { jugador, jornada: numeroJornada } })
 */
@Component({
  selector: 'app-detalle-jugador-jornada',
  templateUrl: './detalle-jugador-jornada.component.html',
  styleUrls: ['./detalle-jugador-jornada.component.scss'],
  imports: [IonIcon, AvatarJugadorComponent],
})
export class DetalleJugadorJornadaComponent {
  @Input({ required: true }) jugador!: JugadorPuntosJornada;
  /** Número de la jornada */
  @Input() jornada: number | null = null;

  private _modalCtrl = inject(ModalController);

  constructor() {
    addIcons({ closeOutline, medkitOutline });
  }

  get nombre(): string {
    const j = this.jugador;
    return j.apodo?.trim() || `${j.nombre} ${j.apellidos ?? ''}`.trim();
  }

  get escudo(): string | null {
    return this.jugador.equipo_escudo ?? this.jugador.escudo ?? null;
  }

  /** Mismo orden que el detalle del jugador: participación, resultado, goles, tarjetas, bonus y destacado. */
  get desglose(): Concepto[] {
    const d = this.jugador.desglose as Record<string, any> | null | undefined;
    if (!d || typeof d !== 'object') return [];
    const filas = [
      d['participacion'],
      d['resultado'],
      ...(Array.isArray(d['goles']) ? d['goles'] : []),
      ...(Array.isArray(d['tarjetas']) ? d['tarjetas'] : []),
      ...(Array.isArray(d['bonusEquipo']) ? d['bonusEquipo'] : []),
      d['destacado'],
    ];
    return filas.filter((f): f is Concepto => !!f && !!f.concepto && typeof f.puntos === 'number');
  }

  signo(puntos: number): string {
    return puntos > 0 ? `+${puntos}` : String(puntos);
  }

  cerrar() {
    this._modalCtrl.dismiss();
  }
}

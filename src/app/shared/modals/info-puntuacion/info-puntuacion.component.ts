import { Component, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { closeOutline, documentTextOutline, football, people, shieldCheckmark, star, trophy } from 'ionicons/icons';

type Pos = 'POR' | 'DEF' | 'MED' | 'DEL';

interface Regla {
  texto: string;
  puntos: number;
  /** Solo para estas posiciones (si no, para todos) */
  posiciones?: Pos[];
  /** Tarjeta dibujada en lugar de icono */
  tarjeta?: 'amarilla' | 'doble' | 'roja';
}

interface Seccion {
  titulo: string;
  icono: string;
  reglas: Regla[];
}

/**
 * "Cómo se puntúa" (botón ⓘ de Clasificación). Sheet en el móvil / tarjeta en el escritorio.
 * Las reglas son las mismas que calcula el backend (jugadores.controller → calcularPuntos).
 *
 *   modalCtrl.create({ component: InfoPuntuacionComponent, ...opcionesModalAuto() })
 */
@Component({
  selector: 'app-info-puntuacion',
  templateUrl: './info-puntuacion.component.html',
  styleUrls: ['./info-puntuacion.component.scss'],
  imports: [IonIcon],
})
export class InfoPuntuacionComponent {
  private _modalCtrl = inject(ModalController);

  readonly secciones: Seccion[] = [
    {
      titulo: 'Participación',
      icono: 'people',
      reglas: [
        { texto: 'Titular', puntos: 2 },
        { texto: 'Suplente', puntos: 1 },
      ],
    },
    {
      titulo: 'Resultado',
      icono: 'trophy',
      reglas: [
        { texto: 'Victoria', puntos: 3 },
        { texto: 'Empate', puntos: 1 },
        { texto: 'Derrota', puntos: 0 },
      ],
    },
    {
      titulo: 'Goles',
      icono: 'football',
      reglas: [
        { texto: 'Gol de portero', puntos: 10, posiciones: ['POR'] },
        { texto: 'Gol de defensa', puntos: 5, posiciones: ['DEF'] },
        { texto: 'Gol de mediocampista', puntos: 4, posiciones: ['MED'] },
        { texto: 'Gol de delantero', puntos: 3, posiciones: ['DEL'] },
        { texto: 'Gol de penalti', puntos: 2 },
        { texto: 'Gol en propia puerta', puntos: -1 },
      ],
    },
    {
      titulo: 'Bonus de equipo',
      icono: 'shield-checkmark',
      reglas: [
        { texto: 'Portería a cero', puntos: 3, posiciones: ['POR', 'DEF'] },
        { texto: 'Encajar 3 o más goles', puntos: -2, posiciones: ['POR', 'DEF'] },
        { texto: 'Su equipo marca 3 o más goles', puntos: 2, posiciones: ['MED', 'DEL'] },
      ],
    },
    {
      titulo: 'Tarjetas',
      icono: 'document-text-outline',
      reglas: [
        { texto: 'Tarjeta amarilla', puntos: -1, tarjeta: 'amarilla' },
        { texto: 'Doble amarilla (expulsión)', puntos: -2, tarjeta: 'doble' },
        { texto: 'Roja directa', puntos: -3, tarjeta: 'roja' },
      ],
    },
    {
      titulo: 'Jugador destacado',
      icono: 'star',
      reglas: [{ texto: 'Destacado del partido por Albero y Mikasa', puntos: 3 }],
    },
  ];

  constructor() {
    addIcons({ closeOutline, documentTextOutline, football, people, shieldCheckmark, star, trophy });
  }

  signo(puntos: number): string {
    return puntos > 0 ? `+${puntos}` : String(puntos);
  }

  cerrar() {
    this._modalCtrl.dismiss();
  }
}

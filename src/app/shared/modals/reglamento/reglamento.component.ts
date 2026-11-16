import { Component, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import {
  calculatorOutline,
  chevronForward,
  closeOutline,
  footballOutline,
  peopleOutline,
  podiumOutline,
  starOutline,
  timeOutline,
} from 'ionicons/icons';
import { opcionesModalAuto } from '../../../core/utils/modal-auto';
import { InfoPuntuacionComponent } from '../info-puntuacion/info-puntuacion.component';

interface Apartado {
  titulo: string;
  icono: string;
  puntos: string[];
}

/**
 * Reglamento: cómo funciona Preferente Fantasy (ligas, alineación, plazos, puntos y clasificación).
 * El detalle de los puntos está en "Cómo se puntúa" (InfoPuntuacionComponent), que se abre desde aquí.
 * Si cambian las reglas del backend (alineaciones.controller → validarOnce), hay que cambiarlo aquí.
 *
 *   modalCtrl.create({ component: ReglamentoComponent, ...opcionesModalAuto() })
 */
@Component({
  selector: 'app-reglamento',
  templateUrl: './reglamento.component.html',
  styleUrls: ['./reglamento.component.scss'],
  imports: [IonIcon],
})
export class ReglamentoComponent {
  private _modalCtrl = inject(ModalController);

  readonly apartados: Apartado[] = [
    {
      titulo: 'Las ligas',
      icono: 'people-outline',
      puntos: [
        'Compites contra los miembros de tu liga. Puedes crear una o unirte a otra: las públicas están en «Ligas abiertas» y a las privadas se entra con su código (PF-XXXX).',
        'Puedes estar en varias ligas a la vez. Cada liga es independiente: tu alineación y tus puntos de una no cuentan en otra.',
        'Quien crea la liga puede cambiarle el nombre, hacerla pública o privada, expulsar miembros o eliminarla.',
      ],
    },
    {
      titulo: 'Tu alineación',
      icono: 'football-outline',
      puntos: [
        'Cada jornada eliges una formación y 11 jugadores reales de la categoría, cada uno en su posición: portero, defensas, mediocampistas y delanteros.',
        'Como mucho 2 jugadores del mismo equipo.',
        'No hay presupuesto ni mercado: cualquier jugador en activo está disponible para todos.',
        'Puedes cargar la alineación de la jornada anterior como punto de partida y cambiar lo que quieras.',
      ],
    },
    {
      titulo: 'Plazos',
      icono: 'time-outline',
      puntos: [
        'Puedes cambiar la alineación tantas veces como quieras hasta la fecha límite, que es el inicio de la jornada.',
        'Si no guardas alineación para una jornada, sumas 0 puntos en ella.',
        'Las alineaciones de los demás se pueden ver en cuanto empieza la jornada, nunca antes.',
      ],
    },
    {
      titulo: 'Puntos',
      icono: 'calculator-outline',
      puntos: [
        'Cada jugador puntúa según el acta oficial de su partido. Tus puntos de la jornada son la suma de tus 11.',
        'Si un jugador tuyo no juega, suma 0: no hay cambios automáticos.',
        'Mientras la jornada está en juego, los puntos se van actualizando según se publican las actas.',
      ],
    },
    {
      titulo: 'Clasificación',
      icono: 'podium-outline',
      puntos: [
        'La general suma los puntos de todas las jornadas. Si hay empate a puntos, se comparte el puesto.',
        'En la clasificación de cada jornada solo aparecen quienes alinearon.',
      ],
    },
    {
      titulo: '11 ideal',
      icono: 'star-outline',
      puntos: [
        'Tras cada jornada se publica el 11 ideal de la categoría. Puedes verlo desde «Mi equipo» en Clasificación.',
      ],
    },
  ];

  constructor() {
    addIcons({
      calculatorOutline,
      chevronForward,
      closeOutline,
      footballOutline,
      peopleOutline,
      podiumOutline,
      starOutline,
      timeOutline,
    });
  }

  async verPuntuacion() {
    const modal = await this._modalCtrl.create({
      component: InfoPuntuacionComponent,
      ...opcionesModalAuto(),
    });
    await modal.present();
  }

  cerrar() {
    this._modalCtrl.dismiss();
  }
}

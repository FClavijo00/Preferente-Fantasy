import { Component, signal } from '@angular/core';
import { CalendarioComponent } from '../calendario/calendario.component';
import { ClasificacionComponent } from '../clasificacion/clasificacion.component';
import { RankingJugadoresComponent } from '../ranking-jugadores/ranking-jugadores.component';

type Pestana = 'partidos' | 'clasificacion' | 'ranking';

const PESTANAS: { id: Pestana; titulo: string }[] = [
  { id: 'partidos', titulo: 'Partidos' },
  { id: 'clasificacion', titulo: 'Clasificación' },
  { id: 'ranking', titulo: 'Ranking' },
];

/**
 * Bloque de la competición real en el Inicio: una tarjeta con tres pestañas.
 * Las tres se cargan al entrar y se ocultan/muestran (no se recargan al cambiar de pestaña).
 */
@Component({
  selector: 'app-competicion',
  templateUrl: './competicion.component.html',
  styleUrls: ['./competicion.component.scss'],
  imports: [CalendarioComponent, ClasificacionComponent, RankingJugadoresComponent],
})
export class CompeticionComponent {
  readonly pestanas = PESTANAS;
  readonly activa = signal<Pestana>('partidos');
}

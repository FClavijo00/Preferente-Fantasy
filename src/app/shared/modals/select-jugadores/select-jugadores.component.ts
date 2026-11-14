import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { closeOutline, medkitOutline, refreshOutline, searchOutline, trashOutline } from 'ionicons/icons';
import { JugadorDisponible, JugadoresService } from '../../../core/services/jugadores-service';
import { AvatarJugadorComponent } from '../../components/avatar-jugador/avatar-jugador.component';

type Posicion = JugadorDisponible['posicion'];
type Orden = 'puntos' | 'media';

const NOMBRE_POSICION: Record<Posicion, string> = {
  POR: 'Portero',
  DEF: 'Defensa',
  MED: 'Mediocampista',
  DEL: 'Delantero',
};

/** Quita tildes y pasa a minúsculas para buscar "garcia" y encontrar "García". */
const normalizar = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Elegir el jugador de un hueco de la alineación (sheet en el móvil / tarjeta en el escritorio).
 * Carga los jugadores de la posición, con buscador, filtro por equipo y orden por puntos o media.
 *
 * Al cerrar devuelve:
 *   - role 'confirm' + el JugadorDisponible elegido
 *   - role 'quitar' para vaciar el hueco
 *   - cualquier otro role: no se cambia nada
 */
@Component({
  selector: 'app-select-jugadores',
  templateUrl: './select-jugadores.component.html',
  styleUrls: ['./select-jugadores.component.scss'],
  imports: [IonIcon, IonSkeletonText, DecimalPipe, AvatarJugadorComponent],
})
export class SelectJugadoresComponent implements OnInit {
  @Input({ required: true }) posicion!: Posicion;
  /** Jugadores que ya están en el once (no se ofrecen) */
  @Input() idsExcluidos: number[] = [];
  /** equipo_id → jugadores ya alineados de ese equipo (sin contar el del hueco que se cambia) */
  @Input() conteo: ReadonlyMap<number, number> = new Map();
  @Input() maxPorEquipo = 2;
  @Input() equipos: { id: number; nombre: string; escudo: string | null }[] = [];
  /** El hueco ya tiene jugador: se muestra "Quitar" */
  @Input() puedeQuitar = false;

  private _jugadoresService = inject(JugadoresService);
  private _modalCtrl = inject(ModalController);

  readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');
  readonly jugadores = signal<JugadorDisponible[]>([]);
  readonly busqueda = signal('');
  readonly equipoFiltro = signal<number | null>(null);
  readonly orden = signal<Orden>('puntos');

  readonly esqueletos = Array.from({ length: 6 });

  readonly lista = computed(() => {
    const texto = normalizar(this.busqueda().trim());
    const equipo = this.equipoFiltro();
    const filtrados = this.jugadores().filter(
      (j) =>
        (equipo === null || j.equipo_id === equipo) &&
        (!texto || normalizar(`${j.apodo ?? ''} ${j.nombre} ${j.apellidos ?? ''} ${j.equipo_nombre}`).includes(texto)),
    );
    if (this.orden() === 'media') {
      return [...filtrados].sort((a, b) => this.media(b) - this.media(a) || b.puntos_totales - a.puntos_totales);
    }
    return filtrados; // el backend ya los manda por puntos
  });

  constructor() {
    addIcons({ closeOutline, medkitOutline, refreshOutline, searchOutline, trashOutline });
  }

  get titulo(): string {
    return `Elegir ${NOMBRE_POSICION[this.posicion]}`;
  }

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    this.estado.set('cargando');
    try {
      const res = await firstValueFrom(this._jugadoresService.getJugadores(this.posicion, this.idsExcluidos));
      this.jugadores.set(res.data ?? []);
      this.estado.set('listo');
    } catch {
      this.estado.set('error');
    }
  }

  media(j: JugadorDisponible): number {
    return j.jornadas_jugadas > 0 ? j.puntos_totales / j.jornadas_jugadas : 0;
  }

  /** Apodo si lo tiene; si no, nombre y apellidos */
  nombre(j: JugadorDisponible): string {
    return j.apodo?.trim() || `${j.nombre} ${j.apellidos ?? ''}`.trim();
  }

  cupo(equipoId: number): number {
    return this.conteo.get(equipoId) ?? 0;
  }

  bloqueado(equipoId: number): boolean {
    return this.cupo(equipoId) >= this.maxPorEquipo;
  }

  /** Pulsar el equipo ya elegido (o la federación) vuelve a mostrar todos */
  filtrarEquipo(id: number | null) {
    this.equipoFiltro.set(this.equipoFiltro() === id ? null : id);
  }

  buscar(evento: Event) {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  elegir(j: JugadorDisponible) {
    if (this.bloqueado(j.equipo_id)) return;
    this._modalCtrl.dismiss(j, 'confirm');
  }

  quitar() {
    this._modalCtrl.dismiss(null, 'quitar');
  }

  cerrar() {
    this._modalCtrl.dismiss(null, 'cancel');
  }
}

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { IonContent } from '@ionic/angular/ion-content';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { chevronForwardOutline, medkitOutline, peopleOutline, refreshOutline, searchOutline } from 'ionicons/icons';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AvatarJugadorComponent } from '../../shared/components/avatar-jugador/avatar-jugador.component';
import { DetalleJugadorComponent } from '../../shared/modals/detalle-jugador/detalle-jugador.component';
import { DetalleEquipoComponent } from '../../shared/modals/detalle-equipo/detalle-equipo.component';
import {
  Equipo,
  EquiposService,
  JugadorPlantillaEquipo,
  PlantillaEquipo,
} from '../../core/services/equipos-service';

type Posicion = JugadorPlantillaEquipo['posicion'];
type Orden = 'posicion' | 'puntos' | 'media';

/** Jugador con la media ya calculada */
interface FilaJugador extends JugadorPlantillaEquipo {
  media: number;
}

const TITULO_POSICION: Record<Posicion, string> = {
  POR: 'Porteros',
  DEF: 'Defensas',
  MED: 'Centrocampistas',
  DEL: 'Delanteros',
};

const ORDENES: { valor: Orden; texto: string }[] = [
  { valor: 'posicion', texto: 'Posición' },
  { valor: 'puntos', texto: 'Puntos' },
  { valor: 'media', texto: 'Media' },
];

/** Último equipo consultado (comodidad de cada dispositivo) */
const CLAVE_EQUIPO = 'pf-plantillas-equipo';

/** Minúsculas y sin tildes, para que buscar "nunez" encuentre "Núñez". */
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Plantillas de los equipos: barra de escudos, cabecera con el puesto en la clasificación
 * (abre el detalle del equipo) y los jugadores con sus puntos y su media. Al pulsar un jugador
 * se abre su detalle con la puntuación de cada jornada.
 */
@Component({
  selector: 'app-plantillas',
  templateUrl: './plantillas.page.html',
  styleUrls: ['./plantillas.page.scss'],
  imports: [IonContent, IonIcon, IonSkeletonText, DecimalPipe, HeaderComponent, AvatarJugadorComponent],
})
export class PlantillasPage implements OnInit {
  private _equiposService = inject(EquiposService);
  private _modalCtrl = inject(ModalController);

  readonly ordenes = ORDENES;
  readonly esqueletos = Array.from({ length: 6 });

  readonly equipos = signal<Equipo[]>([]);
  readonly equipoId = signal<number | null>(null);
  readonly plantilla = signal<PlantillaEquipo | null>(null);
  readonly busqueda = signal('');
  readonly orden = signal<Orden>('posicion');

  readonly estadoEquipos = signal<'cargando' | 'listo' | 'error'>('cargando');
  readonly estadoJugadores = signal<'cargando' | 'listo' | 'error'>('cargando');

  readonly equipo = computed(() => this.equipos().find((e) => e.id === this.equipoId()) ?? null);

  private readonly filas = computed<FilaJugador[]>(() =>
    (this.plantilla()?.jugadores ?? []).map((j) => ({
      ...j,
      media: j.jornadas_jugadas > 0 ? j.puntos_totales / j.jornadas_jugadas : 0,
    })),
  );

  /** Filtrados por la búsqueda */
  private readonly visibles = computed(() => {
    const texto = normalizar(this.busqueda());
    if (!texto) return this.filas();
    return this.filas().filter((j) => normalizar(`${j.apodo ?? ''} ${j.nombre} ${j.apellidos ?? ''}`).includes(texto));
  });

  /**
   * Por posición: un grupo por línea (el backend ya los manda ordenados por puntos dentro de cada una).
   * Por puntos o media: un único grupo, sin título, con todo el equipo de mejor a peor.
   */
  readonly grupos = computed(() => {
    const lista = this.visibles();
    const orden = this.orden();
    if (orden !== 'posicion') {
      const clave = orden === 'puntos' ? 'puntos_totales' : 'media';
      const ordenados = [...lista].sort(
        (a, b) => b[clave] - a[clave] || b.puntos_totales - a.puntos_totales || this.nombre(a).localeCompare(this.nombre(b)),
      );
      return ordenados.length ? [{ posicion: null, titulo: null, jugadores: ordenados }] : [];
    }
    return (Object.keys(TITULO_POSICION) as Posicion[])
      .map((posicion) => ({
        posicion,
        titulo: TITULO_POSICION[posicion],
        jugadores: lista.filter((j) => j.posicion === posicion),
      }))
      .filter((g) => g.jugadores.length > 0);
  });

  readonly resumen = computed(() => {
    const lista = this.filas();
    return { total: lista.length };
  });

  constructor() {
    addIcons({ chevronForwardOutline, medkitOutline, peopleOutline, refreshOutline, searchOutline });
  }

  ngOnInit() {
    this.cargarEquipos();
  }

  async cargarEquipos() {
    this.estadoEquipos.set('cargando');
    try {
      const res = (await firstValueFrom(this._equiposService.getEquiposLimpios())) as { data: Equipo[] };
      const equipos = res.data ?? [];
      this.equipos.set(equipos);
      this.estadoEquipos.set('listo');
      if (this.equipoId() === null && equipos.length > 0) {
        const guardado = this.leerEquipoGuardado();
        this.seleccionarEquipo(equipos.some((e) => e.id === guardado) ? guardado! : equipos[0].id);
      }
    } catch {
      this.estadoEquipos.set('error');
    }
  }

  seleccionarEquipo(id: number) {
    if (this.equipoId() === id && this.estadoJugadores() === 'listo') return;
    this.equipoId.set(id);
    this.busqueda.set('');
    this.guardarEquipo(id);
    this.cargarJugadores();
  }

  async cargarJugadores() {
    const id = this.equipoId();
    if (id === null) return;
    this.estadoJugadores.set('cargando');
    try {
      const res = await firstValueFrom(this._equiposService.getPlantillaEquipo(id));
      // Si mientras tanto se eligió otro equipo, esta respuesta ya no vale
      if (this.equipoId() !== id) return;
      this.plantilla.set(res.data);
      this.estadoJugadores.set('listo');
    } catch {
      if (this.equipoId() === id) this.estadoJugadores.set('error');
    }
  }

  nombre(j: JugadorPlantillaEquipo): string {
    return j.apodo?.trim() || `${j.nombre} ${j.apellidos ?? ''}`.trim();
  }

  /** Nombre completo como segunda línea, solo si se muestra por apodo (como en el panel). */
  nombreCompleto(j: JugadorPlantillaEquipo): string | null {
    return j.apodo?.trim() ? `${j.nombre} ${j.apellidos ?? ''}`.trim() : null;
  }

  buscar(evento: Event) {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  async verJugador(j: JugadorPlantillaEquipo) {
    const modal = await this._modalCtrl.create({
      component: DetalleJugadorComponent,
      cssClass: 'card-modal-center',
      backdropDismiss: true,
      componentProps: { jugadorId: j.id },
    });
    await modal.present();
  }

  async verEquipo() {
    const id = this.equipoId();
    if (id === null) return;
    const modal = await this._modalCtrl.create({
      component: DetalleEquipoComponent,
      cssClass: 'card-modal-center',
      backdropDismiss: true,
      componentProps: { equipoId: id },
    });
    await modal.present();
  }

  private leerEquipoGuardado(): number | null {
    try {
      const v = Number(localStorage.getItem(CLAVE_EQUIPO));
      return Number.isInteger(v) && v > 0 ? v : null;
    } catch {
      return null;
    }
  }

  private guardarEquipo(id: number) {
    try {
      localStorage.setItem(CLAVE_EQUIPO, String(id));
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  }
}

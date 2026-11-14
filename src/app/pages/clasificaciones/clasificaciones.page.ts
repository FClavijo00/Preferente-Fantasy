import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { IonContent } from '@ionic/angular/ion-content';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { caretDown, caretUp, informationCircleOutline, refreshOutline } from 'ionicons/icons';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { LigasService } from '../../core/services/ligas.service';
import { AuthService } from '../../core/services/auth-service.service';
import {
  ClasificacionesService,
  FilaClasificacionLiga,
  JornadaLiga,
} from '../../core/services/clasificaciones.service';
import { InfoPuntuacionComponent } from '../../shared/modals/info-puntuacion/info-puntuacion.component';
import { PlantillaClasificacionComponent } from '../../shared/components/plantilla-clasificacion/plantilla-clasificacion.component';
import { opcionesModalAuto } from '../../core/utils/modal-auto';

type Pestana = 'mi-equipo' | 'jornadas' | 'general';
type Estado = 'cargando' | 'listo' | 'error';

const PESTANAS: { valor: Pestana; texto: string }[] = [
  { valor: 'mi-equipo', texto: 'Mi equipo' },
  { valor: 'jornadas', texto: 'Jornadas' },
  { valor: 'general', texto: 'General' },
];

/**
 * Clasificación de la liga en tres pestañas:
 * - Mi equipo: mi alineación con puntos jornada a jornada (y el 11 ideal).
 * - Jornadas: ranking de cada jornada; al pulsar un usuario se ve su alineación en esa jornada.
 * - General: ranking de la temporada con lo que sube o baja cada uno.
 */
@Component({
  selector: 'app-clasificaciones',
  templateUrl: './clasificaciones.page.html',
  styleUrls: ['./clasificaciones.page.scss'],
  imports: [IonContent, IonIcon, IonSkeletonText, NgTemplateOutlet, HeaderComponent, PlantillaClasificacionComponent],
})
export class ClasificacionesPage {
  private _modalCtrl = inject(ModalController);
  private _ligasService = inject(LigasService);
  private _authService = inject(AuthService);
  private _clasificacionesService = inject(ClasificacionesService);

  readonly pestanas = PESTANAS;
  readonly esqueletos = Array.from({ length: 6 });

  readonly pestana = signal<Pestana>('mi-equipo');
  readonly ligaId = signal<number | null>(null);
  readonly usuarioId = signal<number | null>(null);
  /** Sube cada vez que se entra a la pantalla: recrea "Mi equipo" para traer los puntos al día */
  private readonly recarga = signal(0);
  readonly claveMiEquipo = computed(() => `${this.ligaId()}-${this.usuarioId()}-${this.recarga()}`);

  /** Jornada con la que abrir "Mi equipo" (viene del Inicio: ?vista=mi-equipo&jornada=ID) */
  readonly jornadaInicialMiEquipo = signal<number | null>(null);

  // Jornadas
  readonly jornadas = signal<JornadaLiga[]>([]);
  readonly jornadaId = signal<number | null>(null);
  readonly rankingJornada = signal<FilaClasificacionLiga[]>([]);
  readonly estadoJornadas = signal<Estado>('cargando');
  readonly estadoRankingJornada = signal<Estado>('cargando');

  // General
  readonly rankingGeneral = signal<FilaClasificacionLiga[]>([]);
  readonly estadoGeneral = signal<Estado>('cargando');

  readonly jornada = computed(() => this.jornadas().find((j) => j.id === this.jornadaId()) ?? null);

  constructor() {
    addIcons({ caretDown, caretUp, informationCircleOutline, refreshOutline });

    // Las pestañas de la app no se destruyen: se escucha la URL en todo momento
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        if (params.get('vista') !== 'mi-equipo') return;
        this.pestana.set('mi-equipo');
        const jornada = Number(params.get('jornada'));
        this.jornadaInicialMiEquipo.set(Number.isInteger(jornada) && jornada > 0 ? jornada : null);
      });
  }

  ionViewWillEnter() {
    const liga = this._ligasService.ligaSeleccionada()?.id ?? null;
    const usuario = this._authService.currentUser()?.id ?? null;
    const cambioLiga = liga !== this.ligaId();
    this.ligaId.set(liga);
    this.usuarioId.set(usuario);
    if (cambioLiga) {
      // Otra liga: lo de la anterior ya no vale
      this.jornadas.set([]);
      this.jornadaId.set(null);
      this.rankingJornada.set([]);
      this.rankingGeneral.set([]);
    }
    this.recarga.update((n) => n + 1);
    this.cargarPestana();
  }

  cambiarPestana(p: Pestana) {
    if (p === this.pestana()) return;
    this.pestana.set(p);
    this.cargarPestana();
  }

  private cargarPestana() {
    if (this.pestana() === 'jornadas') this.cargarJornadas();
    if (this.pestana() === 'general') this.cargarGeneral();
  }

  async cargarJornadas() {
    const liga = this.ligaId();
    if (liga === null) return;
    if (!this.jornadas().length) this.estadoJornadas.set('cargando');
    try {
      const res = await firstValueFrom(this._clasificacionesService.getJornadasLiga(liga));
      if (liga !== this.ligaId()) return;
      const jornadas = res.data ?? [];
      this.jornadas.set(jornadas);
      this.estadoJornadas.set('listo');
      // Se mantiene la elegida si sigue existiendo; si no, la más reciente
      const actual = jornadas.find((j) => j.id === this.jornadaId()) ?? jornadas[0];
      if (actual) this.seleccionarJornada(actual, true);
    } catch {
      this.estadoJornadas.set('error');
    }
  }

  async seleccionarJornada(j: JornadaLiga, forzar = false) {
    const liga = this.ligaId();
    if (liga === null || (!forzar && j.id === this.jornadaId())) return;
    this.jornadaId.set(j.id);
    this.estadoRankingJornada.set('cargando');
    try {
      const res = await firstValueFrom(this._clasificacionesService.getClasificacionPorJornada(liga, j.id));
      if (this.jornadaId() !== j.id) return;
      this.rankingJornada.set(res.data ?? []);
      this.estadoRankingJornada.set('listo');
    } catch {
      if (this.jornadaId() === j.id) this.estadoRankingJornada.set('error');
    }
  }

  async cargarGeneral() {
    const liga = this.ligaId();
    if (liga === null) return;
    if (!this.rankingGeneral().length) this.estadoGeneral.set('cargando');
    try {
      const res = await firstValueFrom(this._clasificacionesService.getClasificacion(liga));
      if (liga !== this.ligaId()) return;
      this.rankingGeneral.set(res.data ?? []);
      this.estadoGeneral.set('listo');
    } catch {
      this.estadoGeneral.set('error');
    }
  }

  /** Alineación de un usuario en un sheet: en la jornada elegida (Jornadas) o en la última (General). */
  async verUsuario(f: FilaClasificacionLiga, jornadaId: number | null) {
    const modal = await this._modalCtrl.create({
      component: PlantillaClasificacionComponent,
      ...opcionesModalAuto(),
      componentProps: {
        ligaId: this.ligaId(),
        usuarioId: f.usuario_id,
        usuario: f,
        jornadaInicialId: jornadaId,
      },
    });
    await modal.present();
  }

  /** Botón ⓘ de la cabecera: cómo se puntúa. */
  async abrirInformacionPuntuacion() {
    const modal = await this._modalCtrl.create({
      component: InfoPuntuacionComponent,
      ...opcionesModalAuto(),
    });
    await modal.present();
  }

  textoMovimiento(m: number): string {
    const n = Math.abs(m);
    return `${m > 0 ? 'Sube' : 'Baja'} ${n} ${n === 1 ? 'puesto' : 'puestos'}`;
  }
}

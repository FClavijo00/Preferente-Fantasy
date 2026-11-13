import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { chevronDown, chevronUp, refreshOutline, warning } from 'ionicons/icons';
import { EquiposService } from '../../../core/services/equipos-service';
import { DetalleEquipoComponent } from '../../modals/detalle-equipo/detalle-equipo.component';

/** Fila de la clasificación tal como llega del backend (vista_clasificacion). */
interface ClasificacionApi {
  equipo_id: number;
  equipo: string;
  escudo: string;
  partidos_jugados: number | string;
  puntos: number | string;
  ganados: number | string;
  empatados: number | string;
  perdidos: number | string;
  goles_favor: number | string;
  goles_contra: number | string;
  diferencia_goles: number | string;
  /** Puntos restados por sanciones */
  san: number | string;
  sanciones?: { puntos: number; motivo: string | null }[];
}

export interface FilaClasificacion {
  posicion: number;
  equipoId: number;
  equipo: string;
  escudo: string;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  san: number;
  pts: number;
  zona: Zona | null;
  sanciones: { puntos: number; motivo: string | null }[];
}

type Zona = 'ascenso' | 'playoff' | 'copa' | 'descenso';

/** Zonas por posición en 1ª Andaluza (18 equipos). */
const ZONAS: { zona: Zona; desde: number; hasta: number; texto: string }[] = [
  { zona: 'ascenso', desde: 1, hasta: 1, texto: 'Ascenso a División de Honor' },
  { zona: 'playoff', desde: 2, hasta: 3, texto: 'Playoff de Ascenso y Copa Andalucía' },
  { zona: 'copa', desde: 4, hasta: 5, texto: 'Copa Andalucía' },
  { zona: 'descenso', desde: 15, hasta: 18, texto: 'Descenso' },
];

const zonaDe = (posicion: number): Zona | null =>
  ZONAS.find((z) => posicion >= z.desde && posicion <= z.hasta)?.zona ?? null;

/**
 * Clasificación de la competición real (pestaña "Clasificación").
 * Los puntos ya llegan con las sanciones restadas; aquí se enseña cuánto y por qué.
 */
@Component({
  selector: 'app-clasificacion',
  templateUrl: './clasificacion.component.html',
  styleUrls: ['./clasificacion.component.scss'],
  imports: [IonIcon, IonSkeletonText],
})
export class ClasificacionComponent implements OnInit {
  private _equiposService = inject(EquiposService);
  private _modalCtrl = inject(ModalController);

  readonly filas = signal<FilaClasificacion[]>([]);
  readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');
  /** Tabla compacta (Pos · Equipo · PJ · DG · PTS) o con todas las estadísticas. */
  readonly completa = signal(false);

  readonly zonas = ZONAS;

  constructor() {
    addIcons({ chevronDown, chevronUp, refreshOutline, warning });
  }

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    this.estado.set('cargando');
    try {
      const datos = (await firstValueFrom(this._equiposService.getClasificacion())) as unknown as ClasificacionApi[];
      // Los BIGINT de Postgres llegan como texto: se pasan a número
      this.filas.set(
        (datos ?? []).map((d, i) => ({
          posicion: i + 1,
          equipoId: d.equipo_id,
          equipo: d.equipo,
          escudo: d.escudo,
          pj: Number(d.partidos_jugados),
          g: Number(d.ganados),
          e: Number(d.empatados),
          p: Number(d.perdidos),
          gf: Number(d.goles_favor),
          gc: Number(d.goles_contra),
          dg: Number(d.diferencia_goles),
          san: Number(d.san ?? 0),
          pts: Number(d.puntos),
          zona: zonaDe(i + 1),
          sanciones: d.sanciones ?? [],
        })),
      );
      this.estado.set('listo');
    } catch {
      this.estado.set('error');
    }
  }

  dg(valor: number): string {
    return valor > 0 ? `+${valor}` : String(valor);
  }

  async abrirEquipo(f: FilaClasificacion) {
    const modal = await this._modalCtrl.create({
      component: DetalleEquipoComponent,
      cssClass: 'card-modal-center',
      backdropDismiss: true,
      componentProps: { equipoId: f.equipoId },
    });
    await modal.present();
  }

  textoSancion(f: FilaClasificacion): string {
    const motivos = f.sanciones.map((s) => (s.motivo ? `−${s.puntos} (${s.motivo})` : `−${s.puntos}`));
    return motivos.length ? motivos.join(' · ') : `−${f.san} pts`;
  }
}

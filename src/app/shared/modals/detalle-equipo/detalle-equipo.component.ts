import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { airplane, closeOutline, documentTextOutline, home, locationOutline, navigateOutline, refreshOutline } from 'ionicons/icons';
import { DetalleEquipo, EquiposService, PartidoEquipo } from '../../../core/services/equipos-service';
import { ActaPartidoComponent } from '../../components/acta-partido/acta-partido.component';
import { opcionesModalAuto } from '../../../core/utils/modal-auto';

const FORMATO_FECHA = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

/**
 * Detalle de un equipo (modal centrado, cssClass "card-modal-center").
 * Genérico: recibe solo el id y carga lo demás al abrirse.
 *
 *   modalCtrl.create({ component: DetalleEquipoComponent, cssClass: 'card-modal-center',
 *                      componentProps: { equipoId: 4 } })
 */
@Component({
  selector: 'app-detalle-equipo',
  templateUrl: './detalle-equipo.component.html',
  styleUrls: ['./detalle-equipo.component.scss'],
  imports: [IonIcon, IonSkeletonText],
})
export class DetalleEquipoComponent implements OnInit {
  /** Lo pasa quien abre el modal con componentProps */
  @Input() equipoId!: number;

  private _equiposService = inject(EquiposService);
  private _modalCtrl = inject(ModalController);

  readonly equipo = signal<DetalleEquipo | null>(null);
  readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');

  /** Colores de la equipación: dos mitades si son distintos, uno solo si no. */
  readonly colores = computed(() => {
    const e = this.equipo();
    const primario = e?.color_primario?.trim() || null;
    const secundario = e?.color_secundario?.trim() || null;
    if (!primario && !secundario) return [];
    if (!primario || !secundario || primario.toLowerCase() === secundario.toLowerCase()) {
      return [primario ?? secundario!];
    }
    return [primario, secundario];
  });

  /** Racha: los últimos 5, de más antiguo (izquierda) a más reciente (derecha). */
  readonly racha = computed(() => (this.equipo()?.partidos ?? []).slice(0, 5).reverse());

  constructor() {
    addIcons({ airplane, closeOutline, documentTextOutline, home, locationOutline, navigateOutline, refreshOutline });
  }

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    this.estado.set('cargando');
    try {
      const res = await firstValueFrom(this._equiposService.getDetalleEquipo(this.equipoId));
      this.equipo.set(res.data);
      this.estado.set('listo');
    } catch {
      this.estado.set('error');
    }
  }

  textoResultado(r: PartidoEquipo['resultado']): string {
    return r === 'V' ? 'Victoria' : r === 'E' ? 'Empate' : 'Derrota';
  }

  fecha(p: PartidoEquipo): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(p.fecha_local ?? '');
    if (!m) return '';
    return FORMATO_FECHA.format(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  }

  /**
   * Abre el estadio en Mapas de Apple (iPhone/iPad) o en Google Maps (resto).
   * Con coordenadas va al punto exacto; sin ellas, busca por el nombre del estadio.
   */
  abrirMapa(e: DetalleEquipo) {
    if (!e.estadio) return;
    const hayCoordenadas = e.estadio_lat !== null && e.estadio_lng !== null;
    const busqueda = encodeURIComponent(`${e.estadio}, ${e.nombre}, Jaén`);
    const url = this.esApple()
      ? hayCoordenadas
        ? `https://maps.apple.com/?ll=${e.estadio_lat},${e.estadio_lng}&q=${encodeURIComponent(e.estadio)}`
        : `https://maps.apple.com/?q=${busqueda}`
      : hayCoordenadas
        ? `https://www.google.com/maps/search/?api=1&query=${e.estadio_lat},${e.estadio_lng}`
        : `https://www.google.com/maps/search/?api=1&query=${busqueda}`;
    window.open(url, '_blank');
  }

  async abrirActa(p: PartidoEquipo) {
    if (!p.tiene_acta) return;
    const modal = await this._modalCtrl.create({
      component: ActaPartidoComponent,
      ...opcionesModalAuto(),
      componentProps: { partidoId: p.partido_id },
    });
    await modal.present();
  }

  cerrar() {
    this._modalCtrl.dismiss();
  }

  private esApple(): boolean {
    if (Capacitor.getPlatform() === 'ios') return true;
    const ua = navigator.userAgent;
    // iPadOS se presenta como Mac con pantalla táctil
    return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  }
}

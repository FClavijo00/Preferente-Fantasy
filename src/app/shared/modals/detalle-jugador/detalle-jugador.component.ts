import { afterNextRender, Component, computed, ElementRef, inject, Injector, Input, OnInit, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { closeOutline, medkitOutline, refreshOutline } from 'ionicons/icons';
import { ConceptoPuntos, DetalleJugador, JugadoresService } from '../../../core/services/jugadores-service';
import { AvatarJugadorComponent } from '../../components/avatar-jugador/avatar-jugador.component';

/**
 * Detalle de un jugador (modal centrado, cssClass "card-modal-center").
 * Genérico: recibe solo el id y carga lo demás al abrirse.
 *
 *   modalCtrl.create({ component: DetalleJugadorComponent, cssClass: 'card-modal-center',
 *                      componentProps: { jugadorId: 186 } })
 */
@Component({
  selector: 'app-detalle-jugador',
  templateUrl: './detalle-jugador.component.html',
  styleUrls: ['./detalle-jugador.component.scss'],
  imports: [IonIcon, IonSkeletonText, DecimalPipe, AvatarJugadorComponent],
})
export class DetalleJugadorComponent implements OnInit {
  /** Lo pasa quien abre el modal con componentProps */
  @Input() jugadorId!: number;

  private _jugadoresService = inject(JugadoresService);
  private _modalCtrl = inject(ModalController);
  private _injector = inject(Injector);

  private readonly chipsRef = viewChild<ElementRef<HTMLElement>>('chips');

  readonly jugador = signal<DetalleJugador | null>(null);
  readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');
  readonly jornadaId = signal<number | null>(null);

  readonly jornada = computed(
    () => this.jugador()?.historial.find((h) => h.jornada_id === this.jornadaId()) ?? null,
  );

  /** Desglose en orden lógico: participación, resultado, goles, tarjetas, bonus y destacado. */
  readonly desglose = computed(() => {
    const d = this.jornada()?.desglose;
    if (!d) return [];
    const filas = [
      d.participacion,
      d.resultado,
      ...(d.goles ?? []),
      ...(d.tarjetas ?? []),
      ...(d.bonusEquipo ?? []),
      d.destacado,
    ];
    return filas.filter((f): f is ConceptoPuntos => !!f && !!f.concepto);
  });

  constructor() {
    addIcons({ closeOutline, medkitOutline, refreshOutline });
  }

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    this.estado.set('cargando');
    try {
      const res = await firstValueFrom(this._jugadoresService.getDetalleJugador(this.jugadorId));
      this.jugador.set(res.data);
      this.estado.set('listo');
      // Se abre la jornada más reciente
      const ultima = res.data.historial[0];
      if (ultima) this.seleccionar(ultima.jornada_id, 'auto');
    } catch {
      this.estado.set('error');
    }
  }

  nombre(j: DetalleJugador): string {
    return j.apodo?.trim() || `${j.nombre} ${j.apellidos ?? ''}`.trim();
  }

  seleccionar(jornadaId: number, desplazamiento: ScrollBehavior = 'smooth') {
    this.jornadaId.set(jornadaId);
    // Centra el chip elegido en la fila de jornadas
    afterNextRender(
      () => {
        const chip = this.chipsRef()?.nativeElement.querySelector<HTMLElement>(`[data-jornada="${jornadaId}"]`);
        chip?.scrollIntoView({ behavior: desplazamiento, inline: 'center', block: 'nearest' });
      },
      { injector: this._injector },
    );
  }

  signo(puntos: number): string {
    return puntos > 0 ? `+${puntos}` : String(puntos);
  }

  cerrar() {
    this._modalCtrl.dismiss();
  }
}

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { JornadasService } from '../../../core/services/jornadas-service';
import {
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonBadge,
  IonLabel,
  ModalController,
} from '@ionic/angular';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { ActaPartidoComponent } from '../acta-partido/acta-partido.component';

export interface Equipo {
  id: number;
  nombre: string;
  escudo_url: string;
  escudo: string;
}

export interface Partido {
  partido_id: number;
  fecha_partido: string | null;
  goles_local: number | null;
  goles_visitante: number | null;
  local: Equipo;
  visitante: Equipo;
  jugado: boolean;
  tiene_acta: boolean;
}

export interface Jornada {
  jornada_id: number;
  numero_jornada: number;
  jornada_estado: string;
  partidos: Partido[];
}

@Component({
  selector: 'app-calendario',
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.scss'],
  imports: [
    IonCardContent,
    IonCardHeader,
    IonCard,
    DatePipe
  ],
})
export class CalendarioComponent implements OnInit {
  private _jornadasService = inject(JornadasService);
  private _toastService = inject(ToastService);
  private _modalCtrl = inject(ModalController);

  public calendario = signal<Jornada[]>([]);
  public jornadaSeleccionada = signal<number>(1);

  public jornadaActual = computed(() => {
    return this.calendario().find(
      (j) => j.numero_jornada === this.jornadaSeleccionada(),
    );
  });
  public jornadasTotales = signal<number[]>(Array.from({ length: 0 }, (_, i) => i + 1));

  constructor() { }

  async abrirActaPartido(partido: Partido) {
    if (partido.tiene_acta === true && partido.jugado === true) {
      const modal = await this._modalCtrl.create({
        component: ActaPartidoComponent,
        initialBreakpoint: 1,
        breakpoints: [0, 0.5, 0.75, 1],
        handle: false,
        mode: 'md',
        componentProps: {
          partidoId: partido.partido_id
        },
      });
      await modal.present();
      
      
    } else if (partido.jugado === false) {
      this._toastService.showErrorToast('Este partido no ha sido jugado aún.');
    } else {
      this._toastService.showErrorToast('Este partido no tiene acta aún.');
    }

  }

  async getCalendario() {
    this._jornadasService.getCalendario().subscribe({
      next: (data: any) => {
        this.calendario.set(data);
        const jornadaEnCurso =
          data.find(
            (j: { jornada_estado: string }) => j.jornada_estado === 'EN_JUEGO',
          ) ||
          data.find(
            (j: { jornada_estado: string }) => j.jornada_estado === 'PENDIENTE',
          );
        if (jornadaEnCurso) {
          this.jornadaSeleccionada.set(jornadaEnCurso.numero_jornada);
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  async getJornadaActual() {
    this._jornadasService.getJornadaActual().subscribe({
      next: (data: any) => {
        //this.jornadaActual.set(data);
        this.jornadasTotales.set(Array.from({ length: data.jornadasTotales }, (_, i) => i + 1));
        this.getCalendario();
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  seleccionarJornada(event: any) {
    const numJornada = Number(event);
    this.jornadaSeleccionada.set(numJornada);
  }

  ngOnInit() {
    this.getJornadaActual();
  }
}

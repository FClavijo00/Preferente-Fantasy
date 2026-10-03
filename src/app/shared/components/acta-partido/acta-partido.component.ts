import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { IonItem, IonList, IonAvatar, IonLabel, ModalController, IonContent } from "@ionic/angular";
import { PartidosService } from '../../../core/services/partidos.service';
import { LoadingService } from '../../../core/services/loading.service';
import { DetalleJugadorJornadaComponent } from '../../modals/detalle-jugador-jornada/detalle-jugador-jornada.component';

@Component({
  selector: 'app-acta-partido',
  templateUrl: './acta-partido.component.html',
  styleUrls: ['./acta-partido.component.scss'],
  imports: [IonContent, IonLabel, IonAvatar, IonList, IonItem, ],
})
export class ActaPartidoComponent  implements OnInit {

  @Input({ required: true }) partidoId!: number;

  private _partidosService = inject(PartidosService);
  private _loadingService = inject(LoadingService);
  private _modalCtrl = inject(ModalController);

  partido = signal<any>(null);
  jugadoresLocal = signal<any[]>([]);
  jugadoresLocalTitulares = signal<any[]>([]);
  jugadoresLocalSuplentes = signal<any[]>([]);

  jugadoresVisitante = signal<any[]>([]);
  jugadoresVisitanteTitulares = signal<any[]>([]);
  jugadoresVisitanteSuplentes = signal<any[]>([]);

  constructor() { }

  async cargarActaPartido() {
    this._loadingService.show();

    this._partidosService.getActaPartidoPuntos(this.partidoId).subscribe({
      next: (resp: any) => {
        this.partido.set(resp.data);
        this.jugadoresLocal.set(resp.data.jugadores_local);
        this.jugadoresLocal().map((jugador: any) => {
          if (jugador.titular) {
            this.jugadoresLocalTitulares().push(jugador);
          } else {
            this.jugadoresLocalSuplentes().push(jugador);
          }
        });

        this.jugadoresVisitante.set(resp.data.jugadores_visitante);
        this.jugadoresVisitante().map((jugador: any) => {
          if (jugador.titular) {
            this.jugadoresVisitanteTitulares().push(jugador);
          } else {
            this.jugadoresVisitanteSuplentes().push(jugador);
          }
        });
        this._loadingService.hide();
      },
      error: (error) => {
        console.log(error);
        this._loadingService.hide();
      },
    })
  }

  async verDesglosePuntos(jugador: any) {
    const modal = await this._modalCtrl.create({
      component: DetalleJugadorJornadaComponent,
      cssClass: 'card-modal-center', // Clase CSS para estilizar el modal
      backdropDismiss: true,
      componentProps: {
        jugador: jugador,
        jornada: this.partido().numero_jornada
      },
    });

    await modal.present();
  }

  ngOnInit() {
    if (this.partidoId) {
      this.cargarActaPartido();
    }
  }

}

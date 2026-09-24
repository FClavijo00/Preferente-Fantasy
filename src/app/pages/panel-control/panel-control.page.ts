import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonMenu,
  IonButtons,
  IonMenuButton,
  IonLabel,
  IonList,
  IonItem,
  IonIcon,
  MenuController,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonListHeader,
  ModalController,
  NavController,
  IonBadge,
  IonAvatar,
} from '@ionic/angular';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowBackOutline,
  calendarOutline,
  checkmarkCircleOutline,
  chevronBackCircleOutline,
  chevronBackOutline,
  closeCircleOutline,
  documentTextOutline,
  pencilOutline,
  personCircleOutline,
} from 'ionicons/icons';
import { JornadasService } from '../../core/services/jornadas-service';
import { CrearJornadaComponent } from '../../shared/modals/crear-jornada/crear-jornada.component';
import { CrearEditarPartidoComponent } from '../../shared/modals/crear-editar-partido/crear-editar-partido.component';
import { EquiposService } from '../../core/services/equipos-service';
import { CrearEditarJugadorComponent } from '../../shared/modals/crear-editar-jugador/crear-editar-jugador.component';
import { ActaPartidoComponent } from '../../shared/components/acta-partido/acta-partido.component';

interface Jornada {
  id: number;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  numero_jornada: number;
  competicion_id: number;
}

interface Partido {
  partido_id: number;
  fecha_partido: string | null;
  goles_local: number | null;
  equipo_local_id: number;
  goles_visitante: number | null;
  equipo_visitante_id: number;
  local_nombre: string;
  visitante_nombre: string;
  jugado: boolean;
}

export interface Equipo {
  id: number;
  nombre: string;
  escudo: string;
  escudo_url: string;
  color_primario: string;
  color_secundario: string;
  competicion_id: number;
  jugadores: Jugador[];
}

export interface Jugador {
  id: number;
  nombre: string;
  apellidos: string;
  apodo: string;
  posicion: 'POR' | 'DEF' | 'MED' | 'DEL';
  precio: number;
  puntosTotales: number;
  fotoUrl?: string;
  foto?: string;
}
@Component({
  selector: 'app-panel-control',
  templateUrl: './panel-control.page.html',
  styleUrls: ['./panel-control.page.scss'],
  imports: [
    IonAvatar,
    IonBadge,
    IonListHeader,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonItem,
    IonList,
    IonLabel,
    IonMenuButton,
    IonButtons,
    IonButtons,
    IonMenu,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    HeaderComponent,
  ],
})
export class PanelControlPage implements OnInit {
  private _menuCtrl = inject(MenuController);
  private _jornadasService = inject(JornadasService);
  private _modalCtrl = inject(ModalController);
  private _navCtrl = inject(NavController);
  private _equiposService = inject(EquiposService);

  public content = signal<string>('');
  public jornadas = signal<Jornada[]>([]);
  public jornadaSeleccionada = signal<Jornada>({
    id: 0,
    estado: '',
    fecha_inicio: '',
    fecha_fin: '',
    numero_jornada: 0,
    competicion_id: 0,
  });
  public partidosJornada = signal<Partido[]>([]);

  /* EDITANDO MODES */
  public editandoEstado = signal<boolean>(false);
  public estadoEditadoChange = signal<string>('');
  public editandoPartido = signal<boolean>(false);
  public partidoSeleccionado = signal<Partido>({
    partido_id: 0,
    fecha_partido: '',
    goles_local: 0,
    equipo_local_id: 0,
    goles_visitante: 0,
    equipo_visitante_id: 0,
    local_nombre: '',
    visitante_nombre: '',
    jugado: false,
  });

  equipos = signal<Equipo[]>([]);
  equipoSeleccionado = signal<Equipo | null>(null);
  jugadores = signal<Jugador[]>([]);

  constructor() {
    addIcons({
      calendarOutline,
      personCircleOutline,
      pencilOutline,
      closeCircleOutline,
      checkmarkCircleOutline,
      addOutline,
      arrowBackOutline,
      documentTextOutline
    });
  }

  async abrirMainContent(content: string) {
    this.content.set(content);
    if (content === 'calendario') {
      await this.getJornadas();
    } else if (content === 'jugadores') {
      await this.cargarEquipos();
    }
    await this._menuCtrl.close();
  }

  async crearNuevaJornada() {
    const modal = await this._modalCtrl.create({
      component: CrearJornadaComponent,
      initialBreakpoint: 1,
      breakpoints: [0, 0.5, 0.75, 1],
      handle: false,
      mode: 'md',
      componentProps: {
        modo: 'crear',
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.getJornadas();
    }
  }

  async crearNuevoPartido() {
    const modal = await this._modalCtrl.create({
      component: CrearEditarPartidoComponent,
      initialBreakpoint: 1,
      breakpoints: [0, 0.5, 0.75, 1],
      handle: false,
      mode: 'md',
      componentProps: {
        modo: 'crear',
        jornada: this.jornadaSeleccionada(),
        partido: this.partidoSeleccionado(),
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.getJornadas();
      this.jornadaSeleccionada.set(this.jornadaSeleccionada());
      this.cargarPartidosJornada(this.jornadaSeleccionada().id);
    }
  }

  async abrirEditarPartido() {
    const modal = await this._modalCtrl.create({
      component: CrearEditarPartidoComponent,
      initialBreakpoint: 1,
      breakpoints: [0, 0.5, 0.75, 1],
      handle: false,
      mode: 'md',
      componentProps: {
        modo: 'editar',
        jornada: this.jornadaSeleccionada(),
        partido: this.partidoSeleccionado(),
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.getJornadas();
      this.jornadaSeleccionada.set(this.jornadaSeleccionada());
      this.cargarPartidosJornada(this.jornadaSeleccionada().id);
    }
  }

  async abrirCrearJugador() {
    const modal = await this._modalCtrl.create({
      component: CrearEditarJugadorComponent,
      initialBreakpoint: 1,
      breakpoints: [0, 0.5, 0.75, 1],
      handle: false,
      mode: 'md',
      componentProps: {
        modo: 'crear',
        equipos: this.equipos(),
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.cargarEquipos(data.equipo_id);
    }
  }

  async editarJugador(jugador: Jugador) {
    const modal = await this._modalCtrl.create({
      component: CrearEditarJugadorComponent,
      initialBreakpoint: 1,
      breakpoints: [0, 0.5, 0.75, 1],
      handle: false,
      mode: 'md',
      componentProps: {
        modo: 'editar',
        jugador: jugador,
        equipo: this.equipoSeleccionado(),
        equipos: this.equipos(),
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.cargarEquipos(data.equipo_id);
    }
  }

  async abrirEditarActaPartido(partido: Partido) {
    const modal = await this._modalCtrl.create({
      component: ActaPartidoComponent,
      initialBreakpoint: 1,
      breakpoints: [0, 0.5, 0.75, 1],
      handle: false,
      mode: 'md',
      componentProps: {
        partido: partido
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.getJornadas();
      this.jornadaSeleccionada.set(this.jornadaSeleccionada());
      this.cargarPartidosJornada(this.jornadaSeleccionada().id);
    }
  }

  async getJornadas() {
    this._jornadasService.getJornadas().subscribe({
      next: (data: any) => {
        this.jornadas.set(data);
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  async cargarEquipos(idEquipo?: number) {
    this._equiposService.getEquipos().subscribe({
      next: (data: any) => {
        this.equipos.set(data);
        if (idEquipo) {
          this.seleccionarEquipo(data.find((equipo: Equipo) => equipo.id === idEquipo));
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  seleccionarEquipo(equipo: Equipo) {
    this.equipoSeleccionado.set(equipo);

    const listaCompleta = equipo.jugadores || [];

    this.jugadores.set(listaCompleta);

    /* if (this.posicionFiltro() === 'TODOS') {
        this.jugadoresFiltrados.set(listaCompleta);
      } else {
        this.jugadoresFiltrados.set(
          listaCompleta.filter((j: Jugador) => j.posicion === this.posicionFiltro())
        );
      } */
  }

  seleccionarJornada(event: any) {
    const jornadaID = Number(event.detail.value);
    this.jornadas().forEach((jornada) => {
      if (jornada.id === jornadaID) {
        this.jornadaSeleccionada.set(jornada);
        this.cargarPartidosJornada(jornadaID);
      }
    });
  }

  async cargarPartidosJornada(numeroJornada: number) {
    this._jornadasService.cargarPartidosJornada(numeroJornada).subscribe({
      next: (resp: any) => {
        this.partidosJornada.set(resp.data);
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  editarEstadoJornada(jornada: Jornada) {
    this.editandoEstado.set(true);
  }

  editarPartido(partido: Partido) {
    this.editandoPartido.set(true);
    this.partidoSeleccionado.set(partido);

    this.abrirEditarPartido();
  }

  async guardarEstadoJornada() {
    let data = {
      jornadaId: this.jornadaSeleccionada().id,
      estado: this.estadoEditadoChange(),
    };
    this._jornadasService.cambiarEstadoJornada(data).subscribe({
      next: (resp: any) => {
        this.editandoEstado.set(false);
        this.estadoEditadoChange.set('');
        this.jornadaSeleccionada.set({
          id: 0,
          estado: '',
          fecha_inicio: '',
          fecha_fin: '',
          numero_jornada: 0,
          competicion_id: 0,
        });
        this.getJornadas();
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  volverRecepcion() {
    this._navCtrl.navigateRoot('/recepcion', { replaceUrl: true });
  }

  ngOnInit() {}
}

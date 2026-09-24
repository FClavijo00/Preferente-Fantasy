import { Component, inject, Input, OnInit, signal } from '@angular/core';
import {
  IonHeader,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  ModalController,
  IonToolbar,
  IonContent,
  IonLabel,
  IonItem,
  IonDatetime,
  IonModal,
  IonDatetimeButton,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonCheckbox,
  IonGrid, IonRow, IonCol
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeCircleOutline } from 'ionicons/icons';
import { EquiposService } from '../../../core/services/equipos-service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PartidosService } from '../../../core/services/partidos.service';
import { ToastService } from '../../../core/services/toast.service';
import { format } from 'date-fns';
import { ActaPartidoComponent } from '../../components/acta-partido/acta-partido.component';

interface Equipo {
  id: number;
  nombre: string;
  competicion_id: number;
  color_primario: string;
  color_secundario: string;
  estadio: string;
  jugadores: any[];
}

@Component({
  selector: 'app-crear-editar-partido',
  templateUrl: './crear-editar-partido.component.html',
  styleUrls: ['./crear-editar-partido.component.scss'],
  imports: [
    IonCheckbox,
    IonInput,
    IonDatetimeButton,
    IonModal,
    IonDatetime,
    IonItem,
    IonLabel,
    IonContent,
    IonToolbar,
    IonIcon,
    IonButton,
    IonButtons,
    IonTitle,
    IonHeader,
    IonSelect,
    IonSelectOption,
    ReactiveFormsModule],
})
export class CrearEditarPartidoComponent implements OnInit {
  @Input() jornada: any;
  @Input() modo: any;
  @Input() partido: any;

  private _modalCtrl = inject(ModalController);
  private _equiposService = inject(EquiposService);
  private _partidosService = inject(PartidosService);
  private _fb = inject(FormBuilder);
  private _toastService = inject(ToastService);

  public equipos = signal<Equipo[]>([]);
  public partidoForm: FormGroup = new FormGroup({});
  public hayFecha = signal<boolean>(false);

  /**
   * ACTA PARTIDO
   */
  public plantillaLocal = signal<any>([]);
  public plantillaVisitante = signal<any>([]);
  public golesLocal = signal<number>(0);
  public golesVisitante = signal<number>(0);

  constructor() {
    addIcons({
      closeCircleOutline,
    });
  }

  async getEquipos() {
    this._equiposService.getEquipos().subscribe({
      next: (resp: any) => {
        this.equipos.set(resp);
        if (this.modo === 'editar' && this.partido) {
          this.equipos().forEach((equipo) => {
            if (equipo.id === this.partido.equipo_local_id) {
              this.plantillaLocal.set(equipo.jugadores);
            }
            if (equipo.id === this.partido.equipo_visitante_id) {
              this.plantillaVisitante.set(equipo.jugadores);
            }
          });
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  cambiarEquipoLocal(event: any) {
    this.equipos().forEach((equipo) => {
      if (equipo.id === event.detail.value) {
        this.plantillaLocal.set(equipo.jugadores);
      }
    });
  }

  cambiarEquipoVisitante(event: any) {
    this.equipos().forEach((equipo) => {
      if (equipo.id === event.detail.value) {
        this.plantillaVisitante.set(equipo.jugadores);
      }
    });
  }

  crearEditarPartido() {
    if (this.partidoForm.invalid) {
      return;
    }

    let data = {
      partido_id: this.partido.partido_id || null,
      equipo_local_id: this.partidoForm.value.equipo_local_id,
      equipo_visitante_id: this.partidoForm.value.equipo_visitante_id,
      fecha_partido: this.partidoForm.value.fecha_partido || null,
      goles_local: this.partidoForm.value.goles_local || 0,
      goles_visitante: this.partidoForm.value.goles_visitante || 0,
      jugado: this.partidoForm.value.jugado,
      jornada_id: this.jornada.id,
    };

    if (this.modo === 'crear') {
      this._partidosService.crearPartido(data).subscribe({
        next: (resp: any) => {
          this._toastService.showSuccessToast('Partido creado con exito');
          this._modalCtrl.dismiss(resp, 'confirm');
        },
        error: (error) => {
          console.log(error);
        },
      });
    } else if (this.modo === 'editar') {
      this._partidosService.editarPartido(data).subscribe({
        next: (resp: any) => {
          this._toastService.showSuccessToast('Partido editado con exito');
          this._modalCtrl.dismiss(resp, 'confirm');
        },
        error: (error: any) => {
          console.log(error);
        },
      });
    }
  }

  ionChangeCheckboxJugado(event: any) {
    if (event.detail.checked) {
      this.partidoForm.get('goles_local')?.enable();
      this.partidoForm.get('goles_visitante')?.enable();
    } else {
      this.partidoForm.get('goles_local')?.disable();
      this.partidoForm.get('goles_visitante')?.disable();
    }
  }

  ionChangeCheckboxFecha(event: any) {
    if (event.detail.checked) {
      this.partidoForm.get('fecha_partido')?.enable();
    } else {
      this.partidoForm.get('fecha_partido')?.disable();
    }
  }

  cerrarModal() {
    this._modalCtrl.dismiss();
  }

  ngOnInit() {
    if (this.modo === 'crear') {
      this.partidoForm = this._fb.group({
        equipo_local_id: [null, [Validators.required]],
        equipo_visitante_id: [null, [Validators.required]],
        fecha_partido: [null],
        goles_local: [null],
        goles_visitante: [null],
        jugado: [false, [Validators.required]],
      });
      this.partidoForm.get('goles_local')?.disable();
      this.partidoForm.get('goles_visitante')?.disable();
      this.partidoForm.get('fecha_partido')?.disable();
    } else if (this.modo === 'editar' && this.partido) {
      this.partidoForm = this._fb.group({
        equipo_local_id: [this.partido.equipo_local_id, [Validators.required]],
        equipo_visitante_id: [this.partido.equipo_visitante_id, [Validators.required]],
        fecha_partido: [this.partido.fecha_partido != null ? format(new Date(this.partido.fecha_partido), "yyyy-MM-dd'T'HH:mm") : null],
        goles_local: [this.partido.goles_local || null],
        goles_visitante: [this.partido.goles_visitante || null],
        jugado: [this.partido.jugado, [Validators.required]],
      });
      if (this.partido.jugado) {
        this.partidoForm.get('goles_local')?.enable();
        this.partidoForm.get('goles_visitante')?.enable();
        this.partidoForm.get('fecha_partido')?.enable();
      } else {
        this.partidoForm.get('goles_local')?.disable();
        this.partidoForm.get('goles_visitante')?.disable();
        this.partidoForm.get('fecha_partido')?.disable();
      }
      if (this.partido.fecha_partido != null) {
        this.partidoForm.get('fecha_partido')?.enable();
        this.hayFecha.set(true);
      }
    }

    this.getEquipos();
  }
}

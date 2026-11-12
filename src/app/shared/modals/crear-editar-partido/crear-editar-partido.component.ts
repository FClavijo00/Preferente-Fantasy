import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSpinner } from '@ionic/angular/ion-spinner';
import { IonSelect } from '@ionic/angular/ion-select';
import { IonSelectOption } from '@ionic/angular/ion-select-option';
import { IonModal } from '@ionic/angular/ion-modal';
import { IonDatetime } from '@ionic/angular/ion-datetime';
import { AlertController } from '@ionic/angular/alert-controller';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import {
  add,
  calendarOutline,
  chevronForward,
  closeOutline,
  remove,
  shieldOutline,
  warningOutline,
} from 'ionicons/icons';
import { Equipo, EquiposService } from '../../../core/services/equipos-service';
import { PartidosService } from '../../../core/services/partidos.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingService } from '../../../core/services/loading.service';
import { partesFechaJornada } from '../../../core/utils/fechas-jornada';

/** Lo mínimo que necesita el modal del partido (viene de la sección Calendario). */
export interface PartidoFormulario {
  partido_id?: number;
  equipo_local_id?: number;
  equipo_visitante_id?: number;
  /** "YYYY-MM-DDTHH:mm" en hora de España */
  fecha_partido_local?: string | null;
  goles_local?: number | null;
  goles_visitante?: number | null;
  jugado?: boolean;
  tiene_acta?: boolean;
}

/**
 * En qué punto está el partido:
 * - sin_programar: aún no se sabe cuándo se juega (sin fecha)
 * - programado: tiene fecha, sin resultado
 * - jugado: tiene fecha y resultado
 */
export type EstadoPartido = 'sin_programar' | 'programado' | 'jugado';

type Lado = 'local' | 'visitante';

const ESTADOS: { id: EstadoPartido; titulo: string; ayuda: string }[] = [
  { id: 'sin_programar', titulo: 'Sin programar', ayuda: 'Sin fecha' },
  { id: 'programado', titulo: 'Programado', ayuda: 'Con fecha' },
  { id: 'jugado', titulo: 'Jugado', ayuda: 'Con resultado' },
];

const equiposDistintos = (grupo: AbstractControl): ValidationErrors | null => {
  const { equipo_local_id, equipo_visitante_id } = grupo.value;
  return equipo_local_id && equipo_local_id === equipo_visitante_id ? { mismoEquipo: true } : null;
};

/** Programado y jugado necesitan fecha. */
const fechaSiProgramado = (grupo: AbstractControl): ValidationErrors | null => {
  const { estado, fecha_partido } = grupo.value;
  return estado !== 'sin_programar' && !fecha_partido ? { faltaFecha: true } : null;
};

@Component({
  selector: 'app-crear-editar-partido',
  templateUrl: './crear-editar-partido.component.html',
  styleUrls: ['./crear-editar-partido.component.scss'],
  imports: [ReactiveFormsModule, IonButton, IonIcon, IonSpinner, IonSelect, IonSelectOption, IonModal, IonDatetime],
})
export class CrearEditarPartidoComponent implements OnInit {
  // Los pasa Calendario con componentProps (Ionic los asigna como propiedades)
  @Input() modo: 'crear' | 'editar' = 'crear';
  @Input() jornada: { id: number; numero_jornada: number } | null = null;
  @Input() partido: PartidoFormulario = {};

  private _modalCtrl = inject(ModalController);
  private _alertCtrl = inject(AlertController);
  private _fb = inject(FormBuilder);
  private _equiposService = inject(EquiposService);
  private _partidosService = inject(PartidosService);
  private _toastService = inject(ToastService);
  private _loadingService = inject(LoadingService);

  readonly estados = ESTADOS;
  readonly equipos = signal<Equipo[]>([]);
  readonly enviando = signal(false);
  readonly selectorFecha = signal(false);

  readonly form = this._fb.group(
    {
      equipo_local_id: this._fb.control<number | null>(null, Validators.required),
      equipo_visitante_id: this._fb.control<number | null>(null, Validators.required),
      estado: this._fb.nonNullable.control<EstadoPartido>('sin_programar'),
      fecha_partido: this._fb.nonNullable.control(''),
      goles_local: this._fb.nonNullable.control(0),
      goles_visitante: this._fb.nonNullable.control(0),
    },
    { validators: [equiposDistintos, fechaSiProgramado] },
  );

  /** Valores del formulario como signal, para que la vista reaccione. */
  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly estado = computed(() => this.valores().estado ?? 'sin_programar');
  readonly escudoLocal = computed(() => this.escudoDe(this.valores().equipo_local_id));
  readonly escudoVisitante = computed(() => this.escudoDe(this.valores().equipo_visitante_id));
  readonly partesFecha = computed(() => partesFechaJornada(this.valores().fecha_partido ?? ''));

  /** Lo que se enviaría ahora mismo, y lo que había al abrir (para saber si hay cambios). */
  private readonly datosActuales = computed(() => {
    this.valores();
    return this.datosParaEnviar();
  });
  private datosIniciales = '';
  readonly hayCambios = computed(() => JSON.stringify(this.datosActuales()) !== this.datosIniciales);

  /** Si el partido tiene acta y se cambia algo, al guardar se borrará el acta. */
  readonly tieneActa = computed(() => this.modo === 'editar' && !!this.partido?.tiene_acta);

  /** Mismo estilo de alert que el resto del panel (cssClass como texto: ver calendario-admin). */
  readonly opcionesSelectEquipo = { mode: 'ios', cssClass: 'pf-alert', header: 'Elegir equipo' };

  get esEdicion(): boolean {
    return this.modo === 'editar';
  }

  constructor() {
    addIcons({ add, calendarOutline, chevronForward, closeOutline, remove, shieldOutline, warningOutline });
  }

  ngOnInit() {
    const p = this.partido ?? {};
    const estado: EstadoPartido = p.jugado ? 'jugado' : p.fecha_partido_local ? 'programado' : 'sin_programar';
    this.form.patchValue({
      equipo_local_id: p.equipo_local_id ?? null,
      equipo_visitante_id: p.equipo_visitante_id ?? null,
      estado,
      fecha_partido: p.fecha_partido_local ?? '',
      goles_local: p.goles_local ?? 0,
      goles_visitante: p.goles_visitante ?? 0,
    });
    this.datosIniciales = JSON.stringify(this.datosParaEnviar());
    this.cargarEquipos();
  }

  private async cargarEquipos() {
    try {
      const res = (await firstValueFrom(this._equiposService.getEquiposLimpios())) as { data: Equipo[] };
      this.equipos.set(res.data ?? []);
    } catch {
      this._toastService.showErrorToast('No se han podido cargar los equipos');
    }
  }

  private escudoDe(id: number | null | undefined): string | null {
    return this.equipos().find((e) => e.id === id)?.escudo ?? null;
  }

  // ---------- Estado ----------

  /** Al pasar a programado/jugado sin fecha, se abre directamente el calendario. */
  alCambiarEstado() {
    if (this.form.controls.estado.value !== 'sin_programar' && !this.form.controls.fecha_partido.value) {
      this.selectorFecha.set(true);
    }
  }

  // ---------- Goles ----------

  cambiarGoles(lado: Lado, delta: number) {
    const control = lado === 'local' ? this.form.controls.goles_local : this.form.controls.goles_visitante;
    control.setValue(Math.max(0, Math.min(99, (control.value || 0) + delta)));
  }

  // ---------- Fecha ----------

  elegirFecha(valor: string | string[] | null | undefined) {
    if (typeof valor === 'string') {
      // ion-datetime devuelve "YYYY-MM-DDTHH:mm:ss": nos quedamos con "YYYY-MM-DDTHH:mm"
      this.form.controls.fecha_partido.setValue(valor.slice(0, 16));
    }
    this.selectorFecha.set(false);
  }

  // ---------- Guardar ----------

  private datosParaEnviar() {
    const v = this.form.getRawValue();
    const jugado = v.estado === 'jugado';
    return {
      equipo_local_id: v.equipo_local_id,
      equipo_visitante_id: v.equipo_visitante_id,
      fecha_partido: v.estado !== 'sin_programar' && v.fecha_partido ? v.fecha_partido : null,
      jugado,
      // Sin jugar, el marcador se guarda a 0 (como hasta ahora)
      goles_local: jugado ? v.goles_local : 0,
      goles_visitante: jugado ? v.goles_visitante : 0,
    };
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.hasError('mismoEquipo')) this._toastService.showErrorToast('Elige dos equipos distintos');
      else if (this.form.hasError('faltaFecha')) this._toastService.showErrorToast('Indica la fecha del partido');
      return;
    }
    if (!this.jornada || this.enviando()) return;

    // Editar sin tocar nada: no hay nada que guardar
    if (this.esEdicion && !this.hayCambios()) {
      this._modalCtrl.dismiss(null, 'cancel');
      return;
    }

    const borrarActa = this.tieneActa();
    if (borrarActa && !(await this.confirmarBorrarActa())) return;

    const datos = {
      ...this.datosParaEnviar(),
      partido_id: this.partido?.partido_id ?? null,
      jornada_id: this.jornada.id,
      borrar_acta: borrarActa,
    };

    this.enviando.set(true);
    this._loadingService.show(
      borrarActa ? 'Guardando partido y borrando su acta...' : this.esEdicion ? 'Guardando partido...' : 'Creando partido...',
    );
    try {
      const peticion = this.esEdicion
        ? this._partidosService.editarPartido(datos)
        : this._partidosService.crearPartido(datos);
      const resp = (await firstValueFrom(peticion)) as { message?: string };
      this._toastService.showSuccessToast(
        resp.message && borrarActa ? resp.message : this.esEdicion ? 'Partido actualizado' : 'Partido creado',
      );
      this._modalCtrl.dismiss(resp, 'confirm');
    } catch (error) {
      const err = error as HttpErrorResponse;
      this._toastService.showErrorToast(err.error?.message || 'No se ha podido guardar el partido');
    } finally {
      this._loadingService.hide();
      this.enviando.set(false);
    }
  }

  private async confirmarBorrarActa(): Promise<boolean> {
    const alert = await this._alertCtrl.create({
      mode: 'ios',
      cssClass: ['pf-alert', 'pf-alert-peligro'],
      header: '¿Borrar el acta?',
      message:
        'Este partido tiene acta. Al guardar los cambios se borrarán el acta y los puntos que dio a los jugadores. Tendrás que volver a hacerla.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar y borrar', role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'destructive';
  }

  cerrarModal() {
    this._modalCtrl.dismiss(null, 'cancel');
  }
}

import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSpinner } from '@ionic/angular/ion-spinner';
import { IonModal } from '@ionic/angular/ion-modal';
import { IonDatetime } from '@ionic/angular/ion-datetime';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  chevronForward,
  closeOutline,
  flagOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import { DatosJornada, JornadasService } from '../../../core/services/jornadas-service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingService } from '../../../core/services/loading.service';
import { partesFechaJornada, sumarDias } from '../../../core/utils/fechas-jornada';

/** Lo que recibe el modal: sin id = crear (con valores propuestos), con id = editar. */
export type JornadaFormulario = Partial<DatosJornada> & { id?: number };

type CampoFecha = 'fecha_inicio' | 'fecha_fin';

/** La fecha de fin no puede ser anterior a la de inicio (mismo formato: se comparan como texto). */
const finDespuesDeInicio = (grupo: AbstractControl): ValidationErrors | null => {
  const { fecha_inicio, fecha_fin } = grupo.value;
  return fecha_inicio && fecha_fin && fecha_fin < fecha_inicio ? { finAntesDeInicio: true } : null;
};

@Component({
  selector: 'app-editar-jornada',
  templateUrl: './editar-jornada.component.html',
  styleUrls: ['./editar-jornada.component.scss'],
  imports: [ReactiveFormsModule, IonButton, IonIcon, IonSpinner, IonModal, IonDatetime],
})
export class EditarJornadaComponent implements OnInit {
  /** Lo pasa el panel con componentProps (Ionic lo asigna como propiedad). */
  @Input() jornada: JornadaFormulario = {};

  private _modalCtrl = inject(ModalController);
  private _fb = inject(FormBuilder);
  private _jornadasService = inject(JornadasService);
  private _toastService = inject(ToastService);
  private _loadingService = inject(LoadingService);

  readonly enviando = signal(false);

  readonly camposFecha: { control: CampoFecha; etiqueta: string; icono: string }[] = [
    { control: 'fecha_inicio', etiqueta: 'Inicio · fecha límite', icono: 'flag-outline' },
    { control: 'fecha_fin', etiqueta: 'Fin', icono: 'calendar-outline' },
  ];

  /** Qué fecha se está eligiendo en el calendario (null = cerrado). */
  readonly selector = signal<CampoFecha | null>(null);

  readonly form = this._fb.nonNullable.group(
    {
      numero_jornada: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      fecha_inicio: ['', [Validators.required]],
      fecha_fin: ['', [Validators.required]],
    },
    { validators: finDespuesDeInicio },
  );

  get esEdicion(): boolean {
    return this.jornada.id != null;
  }

  constructor() {
    addIcons({ calendarOutline, chevronForward, closeOutline, flagOutline, informationCircleOutline });
  }

  ngOnInit() {
    this.form.patchValue({
      numero_jornada: this.jornada.numero_jornada ?? 1,
      fecha_inicio: this.jornada.fecha_inicio ?? '',
      fecha_fin: this.jornada.fecha_fin ?? '',
    });
  }

  partes(campo: CampoFecha) {
    return partesFechaJornada(this.form.controls[campo].value);
  }

  fechaInvalida(campo: CampoFecha): boolean {
    const control = this.form.controls[campo];
    const finAntes = campo === 'fecha_fin' && this.form.hasError('finAntesDeInicio');
    return (control.touched && control.invalid) || finAntes;
  }

  abrirSelector(campo: CampoFecha) {
    this.selector.set(campo);
  }

  /** Valor con el que abre el calendario: el actual o, si está vacío, el inicio (para el fin). */
  valorSelector(): string | undefined {
    const campo = this.selector();
    if (!campo) return undefined;
    const valor = this.form.controls[campo].value || (campo === 'fecha_fin' ? this.form.controls.fecha_inicio.value : '');
    return valor || undefined;
  }

  /** ion-datetime devuelve "YYYY-MM-DDTHH:mm:ss": nos quedamos con "YYYY-MM-DDTHH:mm". */
  elegirFecha(valor: string | string[] | null | undefined) {
    const campo = this.selector();
    if (campo && typeof valor === 'string') {
      const control = this.form.controls[campo];
      control.setValue(valor.slice(0, 16));
      control.markAsTouched();
      if (campo === 'fecha_inicio') this.alCambiarInicio();
    }
    this.selector.set(null);
  }

  /** Al poner el inicio, si el fin está vacío o queda antes, se propone inicio + 2 días. */
  alCambiarInicio() {
    const { fecha_inicio, fecha_fin } = this.form.getRawValue();
    if (fecha_inicio && (!fecha_fin || fecha_fin < fecha_inicio)) {
      this.form.controls.fecha_fin.setValue(sumarDias(fecha_inicio, 2));
    }
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.enviando()) return;

    const datos: DatosJornada = {
      ...this.form.getRawValue(),
      numero_jornada: Number(this.form.controls.numero_jornada.value),
    };

    this.enviando.set(true);
    this._loadingService.show(this.esEdicion ? 'Guardando jornada...' : 'Creando jornada...');
    try {
      const resp = this.esEdicion
        ? await firstValueFrom(this._jornadasService.editarJornada({ ...datos, id: this.jornada.id! }))
        : await firstValueFrom(this._jornadasService.crearJornada(datos));
      this._toastService.showSuccessToast(resp.message || 'Jornada guardada');
      this._modalCtrl.dismiss(null, 'confirm');
    } catch (error) {
      const err = error as HttpErrorResponse;
      this._toastService.showErrorToast(err.error?.message || 'No se ha podido guardar la jornada');
    } finally {
      this._loadingService.hide();
      this.enviando.set(false);
    }
  }

  cerrarModal() {
    this._modalCtrl.dismiss(null, 'cancel');
  }
}

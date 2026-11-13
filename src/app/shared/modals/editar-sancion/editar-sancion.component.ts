import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSpinner } from '@ionic/angular/ion-spinner';
import { IonSelect } from '@ionic/angular/ion-select';
import { IonSelectOption } from '@ionic/angular/ion-select-option';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { add, closeOutline, remove, shieldOutline } from 'ionicons/icons';
import { Equipo } from '../../../core/services/equipos-service';
import { Sancion, SancionesService } from '../../../core/services/sanciones.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../core/services/toast.service';

/** Crear (sin sancion) o editar (con sancion) una sanción de puntos. */
@Component({
  selector: 'app-editar-sancion',
  templateUrl: './editar-sancion.component.html',
  styleUrls: ['./editar-sancion.component.scss'],
  imports: [ReactiveFormsModule, IonButton, IonIcon, IonSpinner, IonSelect, IonSelectOption],
})
export class EditarSancionComponent implements OnInit {
  // Los pasa la sección Sanciones con componentProps
  @Input() sancion: Sancion | null = null;
  @Input() equipos: Equipo[] = [];

  private _modalCtrl = inject(ModalController);
  private _fb = inject(FormBuilder);
  private _sancionesService = inject(SancionesService);
  private _loadingService = inject(LoadingService);
  private _toastService = inject(ToastService);

  readonly enviando = signal(false);

  readonly form = this._fb.nonNullable.group({
    equipo_id: this._fb.control<number | null>(null, Validators.required),
    puntos: [3, [Validators.required, Validators.min(1), Validators.max(99)]],
    motivo: ['', [Validators.maxLength(200)]],
  });

  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly escudo = computed(() => this.equipos.find((e) => e.id === this.valores().equipo_id)?.escudo ?? null);
  readonly puntos = computed(() => this.valores().puntos ?? 1);

  /** Mismo estilo de alert que el resto del panel (cssClass como texto en ion-select). */
  readonly opcionesSelectEquipo = { mode: 'ios', cssClass: 'pf-alert', header: 'Equipo sancionado' };

  get esEdicion(): boolean {
    return this.sancion !== null;
  }

  constructor() {
    addIcons({ add, closeOutline, remove, shieldOutline });
  }

  ngOnInit() {
    if (this.sancion) {
      this.form.patchValue({
        equipo_id: this.sancion.equipo_id,
        puntos: this.sancion.puntos,
        motivo: this.sancion.motivo ?? '',
      });
    }
  }

  cambiarPuntos(delta: number) {
    const actual = this.form.controls.puntos.value || 1;
    this.form.controls.puntos.setValue(Math.max(1, Math.min(99, actual + delta)));
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this._toastService.showErrorToast(
        this.form.controls.equipo_id.invalid ? 'Elige el equipo sancionado' : 'Revisa los campos marcados',
      );
      return;
    }
    if (this.enviando()) return;

    const v = this.form.getRawValue();
    const datos = { equipo_id: v.equipo_id!, puntos: Number(v.puntos), motivo: v.motivo.trim() || null };

    this.enviando.set(true);
    this._loadingService.show(this.esEdicion ? 'Guardando sanción...' : 'Creando sanción...');
    try {
      const resp = this.sancion
        ? await firstValueFrom(this._sancionesService.editarSancion({ ...datos, id: this.sancion.id }))
        : await firstValueFrom(this._sancionesService.crearSancion(datos));
      this._toastService.showSuccessToast(resp.message || 'Sanción guardada');
      this._modalCtrl.dismiss(null, 'confirm');
    } catch (error) {
      const err = error as HttpErrorResponse;
      this._toastService.showErrorToast(err.error?.message || 'No se ha podido guardar la sanción');
    } finally {
      this._loadingService.hide();
      this.enviando.set(false);
    }
  }

  cerrarModal() {
    this._modalCtrl.dismiss(null, 'cancel');
  }
}

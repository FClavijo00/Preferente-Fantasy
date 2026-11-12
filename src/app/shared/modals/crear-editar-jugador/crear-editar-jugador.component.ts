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
import { IonToggle } from '@ionic/angular/ion-toggle';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { cameraOutline, closeOutline, shieldOutline, trashOutline } from 'ionicons/icons';
import { CropModalComponent } from '../../components/crop-modal/crop-modal.component';
import { Equipo } from '../../../core/services/equipos-service';
import { JugadorAdmin, JugadoresService } from '../../../core/services/jugadores-service';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../core/services/toast.service';

type Posicion = JugadorAdmin['posicion'];

const POSICIONES: { id: Posicion; titulo: string }[] = [
  { id: 'POR', titulo: 'Portero' },
  { id: 'DEF', titulo: 'Defensa' },
  { id: 'MED', titulo: 'Medio' },
  { id: 'DEL', titulo: 'Delantero' },
];

@Component({
  selector: 'app-crear-editar-jugador',
  templateUrl: './crear-editar-jugador.component.html',
  styleUrls: ['./crear-editar-jugador.component.scss'],
  imports: [ReactiveFormsModule, IonButton, IonIcon, IonSpinner, IonSelect, IonSelectOption, IonToggle],
})
export class CrearEditarJugadorComponent implements OnInit {
  // Los pasa la sección Jugadores con componentProps (Ionic los asigna como propiedades)
  @Input() modo: 'crear' | 'editar' = 'crear';
  @Input() jugador: JugadorAdmin | null = null;
  /** Equipo que se está viendo: es el que se propone al crear. */
  @Input() equipo: Equipo | null = null;
  @Input() equipos: Equipo[] = [];

  private _modalCtrl = inject(ModalController);
  private _fb = inject(FormBuilder);
  private _jugadoresService = inject(JugadoresService);
  private _toastService = inject(ToastService);
  private _loadingService = inject(LoadingService);

  readonly posiciones = POSICIONES;
  readonly enviando = signal(false);

  /** Foto nueva recortada (aún sin subir) y su vista previa. */
  private fotoNueva: File | null = null;
  readonly vistaPrevia = signal<string | null>(null);
  /** Quitar la foto que ya tenía (solo al editar). */
  readonly quitarFoto = signal(false);

  readonly form = this._fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
    apellidos: ['', [Validators.required, Validators.maxLength(60)]],
    apodo: ['', [Validators.maxLength(60)]],
    posicion: this._fb.control<Posicion | null>(null, Validators.required),
    equipo_id: this._fb.control<number | null>(null, Validators.required),
    activo: [true],
    lesionado: [false],
  });

  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly posicion = computed(() => this.valores().posicion ?? null);
  readonly escudoEquipo = computed(
    () => this.equipos.find((e) => e.id === this.valores().equipo_id)?.escudo ?? null,
  );

  /** Lo que se muestra en la foto: la nueva, la que tenía (si no se ha quitado) o ninguna. */
  readonly fotoMostrada = computed(() => {
    if (this.vistaPrevia()) return this.vistaPrevia();
    if (this.quitarFoto()) return null;
    return this.jugador?.foto ?? null;
  });

  /** Mismo estilo de alert que el resto del panel (cssClass como texto en ion-select). */
  readonly opcionesSelectEquipo = { mode: 'ios', cssClass: 'pf-alert', header: 'Equipo' };

  get esEdicion(): boolean {
    return this.modo === 'editar';
  }

  constructor() {
    addIcons({ cameraOutline, closeOutline, shieldOutline, trashOutline });
  }

  ngOnInit() {
    const j = this.jugador;
    this.form.patchValue({
      nombre: j?.nombre ?? '',
      apellidos: j?.apellidos ?? '',
      apodo: j?.apodo ?? '',
      posicion: j?.posicion ?? null,
      equipo_id: j?.equipo_id ?? this.equipo?.id ?? null,
      activo: j ? j.activo !== false : true,
      lesionado: !!j?.lesionado,
    });
  }

  // ---------- Foto ----------

  async alElegirFoto(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const modal = await this._modalCtrl.create({
      component: CropModalComponent,
      componentProps: { imageChangedEvent: event },
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<{ croppedImageBase64: string; croppedImageFile: File }>();
    if (role === 'confirm' && data?.croppedImageFile) {
      this.fotoNueva = data.croppedImageFile;
      this.vistaPrevia.set(data.croppedImageBase64);
      this.quitarFoto.set(false);
    }
    // Para poder volver a elegir el mismo archivo
    input.value = '';
  }

  eliminarFoto() {
    this.fotoNueva = null;
    this.vistaPrevia.set(null);
    this.quitarFoto.set(true);
  }

  // ---------- Guardar ----------

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this._toastService.showErrorToast(
        this.form.controls.posicion.invalid ? 'Elige la posición del jugador' : 'Revisa los campos marcados',
      );
      return;
    }
    if (this.enviando()) return;

    const v = this.form.getRawValue();
    const datos = new FormData();
    if (this.jugador) datos.append('id', String(this.jugador.id));
    datos.append('equipo_id', String(v.equipo_id));
    datos.append('nombre', v.nombre.trim());
    datos.append('apellidos', v.apellidos.trim());
    datos.append('apodo', v.apodo.trim());
    datos.append('posicion', v.posicion!);
    // Booleanos explícitos: antes "activo || true" impedía desactivar a un jugador
    datos.append('activo', String(v.activo));
    datos.append('lesionado', String(v.lesionado));
    // El nombre del fichero lo pone el servidor
    if (this.fotoNueva) datos.append('foto', this.fotoNueva, 'foto.webp');
    else if (this.quitarFoto()) datos.append('quitar_foto', 'true');

    this.enviando.set(true);
    this._loadingService.show(this.esEdicion ? 'Guardando jugador...' : 'Creando jugador...');
    try {
      const peticion = this.esEdicion
        ? this._jugadoresService.editarJugador(datos)
        : this._jugadoresService.crearJugador(datos);
      const resp = (await firstValueFrom(peticion)) as { message?: string; data?: unknown };
      this._toastService.showSuccessToast(resp.message || 'Jugador guardado');
      this._modalCtrl.dismiss(resp.data, 'confirm');
    } catch (error) {
      const err = error as HttpErrorResponse;
      this._toastService.showErrorToast(err.error?.message || 'No se ha podido guardar el jugador');
    } finally {
      this._loadingService.hide();
      this.enviando.set(false);
    }
  }

  cerrarModal() {
    this._modalCtrl.dismiss(null, 'cancel');
  }
}

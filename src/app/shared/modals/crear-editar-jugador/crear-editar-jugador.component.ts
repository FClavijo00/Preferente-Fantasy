import {
  Component,
  ElementRef,
  inject,
  Input,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonDatetimeButton,
  IonModal,
  IonDatetime,
  IonCheckbox,
  IonGrid,
  IonRow,
  IonCol,
  IonButtons,
  IonTitle,
  ModalController,
  IonSelectOption,
  IonSelect,
  IonToggle,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  checkmarkSharp,
  closeCircleOutline,
} from 'ionicons/icons';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import { CropModalComponent } from '../../components/crop-modal/crop-modal.component';
import { ToastService } from '../../../core/services/toast.service';
import { JugadoresService } from '../../../core/services/jugadores-service';

@Component({
  selector: 'app-crear-editar-jugador',
  templateUrl: './crear-editar-jugador.component.html',
  styleUrls: ['./crear-editar-jugador.component.scss'],
  imports: [
    IonTitle,
    IonButtons,
    IonInput,
    IonLabel,
    IonItem,
    IonContent,
    IonIcon,
    IonButton,
    IonToolbar,
    IonHeader,
    ReactiveFormsModule,
    IonSelectOption,
    ImageCropperComponent,
    IonSelect,
    IonSelectOption,
    IonToggle,
  ],
})
export class CrearEditarJugadorComponent implements OnInit {
  @Input() modo: any;
  @Input() equipo: any;
  @Input() equipos: any;
  @Input() jugador: any;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private _modalCtrl = inject(ModalController);
  private _fb = inject(FormBuilder);
  private _toastService = inject(ToastService);
  private _jugadoresService = inject(JugadoresService);

  imageChangedEvent: Event | null = null;
  croppedImageFile: File | null = null;
  imagenPreview = signal<string | null>(null);

  public jugadorForm: FormGroup = this._fb.group({
    id: [null],
    equipo_id: [null, [Validators.required]],
    nombre: ['', [Validators.required]],
    apellidos: ['', [Validators.required]],
    apodo: [null],
    posicion: [null, [Validators.required]],
    lesionado: [false],
    activo: [true],
    foto_url: [null],
    foto: [null],
  });

  // Evento al seleccionar archivo en el input
  fileChangeEvent(event: Event): void {
    this.imageChangedEvent = event;
  }

  // Evento al recortar la imagen con ngx-image-cropper
  imageCropped(event: ImageCroppedEvent) {
    if (event.objectUrl && event.blob) {
      this.imagenPreview.set(event.objectUrl);

      // Convertimos el Blob a File para enviarlo en el FormData
      let nombreArchivo = '';
      if (
        this.jugadorForm.value.apodo != '' &&
        this.jugadorForm.value.apodo != null
      ) {
        nombreArchivo = this.generarNombreArchivo('apodo');
      } else {
        nombreArchivo = this.generarNombreArchivo('nombreApellidos');
      }
      this.croppedImageFile = new File([event.blob], nombreArchivo, {
        type: 'image/webp',
      });
      this.jugadorForm.patchValue({ foto: this.croppedImageFile });
      this.jugadorForm.patchValue({ foto_url: nombreArchivo });
    }
  }

  private generarNombreArchivo(tipo: string): string {
    let apodo = '';
    let nombre = '';
    let apellidos = '';
    let textoCompleto = '';
    if (tipo === 'apodo') {
      apodo = this.jugadorForm.value.apodo || '';
      textoCompleto = apodo;
    } else if (tipo === 'nombreApellidos') {
      nombre = this.jugadorForm.value.nombre || '';
      apellidos = this.jugadorForm.value.apellidos || '';
      textoCompleto = `${nombre} ${apellidos}`;
    }

    const slug = textoCompleto
      .toLowerCase()
      .normalize('NFD') // Descompone caracteres con tildes (ej. "é" -> "e" + accent mark)
      .replace(/[\u0300-\u036f]/g, '') // Elimina las tildes y diacríticos
      .replace(/ñ/g, 'n') // Reemplaza la ñ por n
      .trim()
      .replace(/\s+/g, '-') // Reemplaza uno o más espacios por un guion
      .replace(/[^a-z0-9-]/g, ''); // Elimina cualquier otro carácter especial

    return `${slug}.webp`;
  }

  // Cancela el recorte y resetea el control
  cancelarCropper() {
    this.imageChangedEvent = null;
    this.croppedImageFile = null;
    this.imagenPreview.set(null);

    // Limpia el input file para permitir seleccionar la misma imagen de nuevo si el usuario quiere
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  constructor() {
    addIcons({
      closeCircleOutline,
      cameraOutline,
      checkmarkSharp,
    });
  }

  cerrarModal() {
    this._modalCtrl.dismiss();
  }

  guardarJugador() {
    if (this.jugadorForm.invalid) {
      this._toastService.showErrorToast(
        'Por favor, completa todos los campos.',
      );
      return;
    }

    const formData = new FormData();
    const formValues = this.jugadorForm.value;

    formData.append('id', formValues.id || '');
    formData.append('equipo_id', formValues.equipo_id || '');
    formData.append('nombre', formValues.nombre || '');
    formData.append('apellidos', formValues.apellidos || '');
    if (formValues.apodo) formData.append('apodo', formValues.apodo || '');
    formData.append('posicion', formValues.posicion || '');
    formData.append('lesionado', formValues.lesionado || false);
    formData.append('activo', formValues.activo || true);
    if (formValues.foto_url)
      formData.append('foto_url', formValues.foto_url || '');

    if (this.croppedImageFile) {
      formData.append(
        'foto',
        this.croppedImageFile,
        this.croppedImageFile.name,
      );
    }

    if (this.modo === 'crear') {
      this._jugadoresService.crearJugador(formData).subscribe({
        next: (resp: any) => {
          if (resp.ok) {
            this._toastService.showSuccessToast(
              'Jugador creado correctamente.',
            );
            this._modalCtrl.dismiss(resp.data, 'confirm');
          }
        },
        error: () => {
          this._toastService.showErrorToast('Error al crear jugador.');
        },
      });
    } else if (this.modo === 'editar') {
      this._jugadoresService.editarJugador(formData).subscribe({
        next: (resp: any) => {
          if (resp.ok) {
            this._toastService.showSuccessToast(
              'Jugador editado correctamente.',
            );
            this._modalCtrl.dismiss(resp.data, 'confirm');
          }
        },
        error: () => {
          this._toastService.showErrorToast('Error al editar jugador.');
        },
      });
    }
  }

  ngOnInit() {
    if (this.modo === 'editar') {
      this.jugadorForm.patchValue({
        id: this.jugador.id,
        equipo_id: this.equipo.id,
        nombre: this.jugador.nombre,
        apellidos: this.jugador.apellidos,
        apodo: this.jugador.apodo,
        posicion: this.jugador.posicion,
        lesionado: this.jugador.lesionado,
        activo: this.jugador.activo,
        foto_url: this.jugador.foto_url,
        foto: this.jugador.foto,
      });
    }
  }
}

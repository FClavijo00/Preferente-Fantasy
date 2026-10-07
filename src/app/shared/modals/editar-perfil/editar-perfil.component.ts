import { Component, inject, Input, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { cameraOutline, shieldOutline, atOutline } from 'ionicons/icons';
import { LoadingService } from '../../../core/services/loading.service';
import { AuthService } from '../../../core/services/auth-service.service';
import {
  IonContent,
  IonItem,
  IonInput,
  IonIcon,
  IonHeader,
  IonButtons,
  IonButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { CropModalComponent } from '../../components/crop-modal/crop-modal.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-editar-perfil',
  templateUrl: './editar-perfil.component.html',
  styleUrls: ['./editar-perfil.component.scss'],
  imports: [
    IonToolbar,
    IonTitle,
    IonButton,
    IonButtons,
    IonHeader,
    IonIcon,
    IonInput,
    IonContent,
    ReactiveFormsModule
],
})
export class EditarPerfilComponent implements OnInit {
  @Input({ required: true }) userData!: any;

  private _fb = inject(FormBuilder);
  private _modalCtrl = inject(ModalController);
  private _authService = inject(AuthService);
  private _loadingService = inject(LoadingService);
  private _toastService = inject(ToastService);

  perfilForm!: FormGroup;
  imagenPreview = signal<string | null>(null);
  archivoSeleccionado = signal<File | null>(null);

  constructor() {
    addIcons({ cameraOutline, shieldOutline, atOutline });
  }

  ngOnInit() {
    this.imagenPreview.set(this.userData.image_url || null);

    this.perfilForm = this._fb.group({
      nombre_club: [
        this.userData?.nombre_club || '',
        [Validators.required, Validators.minLength(3)],
      ],
      nombre_usuario: [
        this.userData?.nombre_usuario || '',
        [
          Validators.required,
          Validators.minLength(3),
          /* Validators.pattern('^[a-zA-Z0-9_]+$'), */
        ],
      ],
      foto: [null],
      foto_url: [null],
    });
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    const modal = await this._modalCtrl.create({
      component: CropModalComponent,
      componentProps: {
        imageChangedEvent: event,
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.imagenPreview.set(data.croppedImageBase64);

      this.perfilForm.patchValue({ foto: data.croppedImageFile });
      this.perfilForm.patchValue({ foto_url: data.croppedImageFile.name });
    }

    input.value = '';
  }

  async guardarCambios() {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    this._loadingService.show('Guardando cambios...');

    const formData = new FormData();
    const formValues = this.perfilForm.value;

    formData.append('nombre_club', this.perfilForm.value.nombre_club);
    formData.append('nombre_usuario', this.perfilForm.value.nombre_usuario);
    formData.append('id', this.userData.id);

    if (formValues.foto_url !== null && formValues.foto_url !== '') {
      formData.append('foto_url', formValues.foto_url);
    }

    if (formValues.foto !== null) {
      formData.append('foto', formValues.foto, formValues.foto_url);
    }

    this._authService
      .actualizarPerfil(formData)
      .subscribe({
        next: (resp: any) => {
          this._loadingService.hide();
          if (resp.ok) {
            // Devolvemos el usuario actualizado al cerrar el modal
            this._authService.setCurrentUser(resp.data);
            this._modalCtrl.dismiss(resp.data, 'confirm');
            this._toastService.showSuccessToast(resp.message);
          }
        },
        error: (err) => {
          console.error('Error al actualizar perfil:', err);
          this._loadingService.hide();
        },
      });
  }

  cerrarModal() {
    this._modalCtrl.dismiss();
  }
}

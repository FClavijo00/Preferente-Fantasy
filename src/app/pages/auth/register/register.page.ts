import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonInput,
  ToastController,
  LoadingController,
  NavController,
  ModalController,
  IonSpinner,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  shirtOutline,
  shieldHalfOutline,
  footballOutline,
  cameraOutline,
  personCircleOutline,
} from 'ionicons/icons';
import { CropModalComponent } from '../../../shared/components/crop-modal/crop-modal.component';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth-service.service';
import { firstValueFrom } from 'rxjs';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [
    IonSpinner,
    IonIcon,
    IonButton,
    IonContent,
    CommonModule,
    FormsModule,
    IonInput,
    ReactiveFormsModule,
  ],
  standalone: true,
})
export class RegisterPage implements OnInit {
  private _fb = inject(FormBuilder);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private _navCtrl = inject(NavController);
  private _modalCtrl = inject(ModalController);
  private _toastService = inject(ToastService);
  private _authService = inject(AuthService);
  private _loadingService = inject(LoadingService);

  registerForm: FormGroup = this._fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    club: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    foto: [null],
    foto_url: [null],
  });

  avatarPreview = signal<string | null>(null);
  selectedFile: File | null = null;

  loadingSpinner = signal<boolean>(false);

  showPassword = signal<boolean>(false);

  currentYear = signal<number>(new Date().getFullYear());

  constructor() {
    addIcons({
      cameraOutline,
      personCircleOutline,
      shieldHalfOutline,
      mailOutline,
      lockClosedOutline,
      footballOutline,
      eyeOutline,
      eyeOffOutline,
      shirtOutline,
    });
  }

  toggleShowPassword() {
    this.showPassword.set(!this.showPassword());
  }
  ngOnInit(): void {
    this.avatarPreview.set(null);
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
      this.avatarPreview.set(data.croppedImageBase64);

      this.registerForm.patchValue({ foto: data.croppedImageFile });
      this.registerForm.patchValue({ foto_url: data.croppedImageFile.name });
    }

    // Limpiamos el input para permitir volver a seleccionar la misma imagen si se desea
    input.value = '';
  }

  async onRegister() {
    if (this.registerForm.invalid) {
      this._toastService.showErrorToast(
        'Por favor, completa todos los campos correctamente.',
      );
      return;
    }

    this.loadingSpinner.set(true);
    this._loadingService.show('Registrando usuario...');

    try {
      const formData = new FormData();
      const formValues = this.registerForm.value;
      
      formData.append('username', formValues.username || '');
      formData.append('club', formValues.club || '');
      formData.append('email', formValues.email || '');
      formData.append('password', formValues.password || '');
      
      if (formValues.foto_url !== null && formValues.foto_url !== '') {
        formData.append('foto_url', formValues.foto_url);
      }

      if (formValues.foto !== null) {
        formData.append('foto', formValues.foto, formValues.foto_url);
      }

      const response = await firstValueFrom(
        this._authService.register(formData),
      );
      if (response) {
        this.loadingSpinner.set(false);
        this._loadingService.hide();
        this._toastService.showSuccessToast('Usuario creado con éxito.');
        this._navCtrl.navigateBack('/login');
      }
    } catch (error: any) {
      this.loadingSpinner.set(false);
      this._loadingService.hide();
      this._toastService.showErrorToast(
        error.error.message || 'Ha ocurrido un error.',
      );
    } finally {
      this.loadingSpinner.set(false);
    }
  }

  backLogin() {
    this._navCtrl.navigateBack('/login');
  }
}

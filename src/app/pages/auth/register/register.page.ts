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

  registerForm: FormGroup = new FormGroup({});
  avatarPreview = signal<string | null>(null);
  selectedFile: File | null = null;

  username = signal<string>('');
  club = signal<string>('');
  email = signal<string>('');
  password = signal<string>('');

  loadingSpinner = signal<boolean>(false);

  isEmailValid = computed(() => {
    const val = this.email().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  });

  isPasswordValid = computed(() => {
    return this.password().length >= 6;
  });

  showPassword = signal<boolean>(false);

  isFormValid = computed(
    () =>
      this.isEmailValid() &&
      this.isPasswordValid() &&
      this.username().length >= 3 &&
      this.club().length >= 3,
  );

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

    this.registerForm = this._fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      club: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  toggleShowPassword() {
    this.showPassword.update((val) => !val);
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
      this.avatarPreview.set(data);

      // Usamos el helper asíncrono
      this.selectedFile = await this.dataURLtoFile(
        data,
        `avatar_${Date.now()}.webp`,
      );
      console.log(this.selectedFile);
      /* this.selectedFile = this.base64ToFile(data, `avatar_${Date.now()}.png`);
      console.log(this.selectedFile); */
    }

    // Limpiamos el input para permitir volver a seleccionar la misma imagen si se desea
    input.value = '';
  }

  private async dataURLtoFile(
    dataUrl: string,
    filename: string,
  ): Promise<File> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  }

  // Helper opcional para convertir el Base64 resultante a un objeto File
  private base64ToFile(base64Data: string, filename: string): File {
    // Separamos la cabecera (data:image/png;base64,) del contenido real
    const parts = base64Data.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/webp';

    // Limpiamos la cadena quitando espacios o saltos de línea por si acaso
    const base64Clean = parts[1]
      ? parts[1].replace(/\s/g, '')
      : parts[0].replace(/\s/g, '');

    // atob ahora recibe solo el payload Base64 sin el prefijo "data:..."
    const byteString = atob(base64Clean);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    return new File([arrayBuffer], filename, { type: mime });
  }

  async onRegister() {
    if (this.registerForm.invalid) {
      this._toastService.showErrorToast(
        'Por favor, completa todos los campos correctamente.',
      );
      return;
    }

    this.loadingSpinner.update((val) => true);

    try {
      let data = {
        username: this.registerForm.value.username,
        club: this.registerForm.value.club,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password
      }
      const response = await firstValueFrom(
        this._authService.register(data),
      );
      if (response) {
        this.loadingSpinner.update((val) => false);
        this._toastService.showSuccessToast('Usuario creado con éxito.');
        this._navCtrl.navigateBack('/login');
      }
    } catch (error) {
      this.loadingSpinner.update((val) => false);
      this._toastService.showErrorToast(
        'Error al registrar el usuario.',
      );
    } finally {
      this.loadingSpinner.update((val) => false);
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'bottom',
    });
    toast.present();
  }

  private async uploadImageToBucket(file: File): Promise<string> {
    const fileName = `avatars/${Date.now()}-${file.name}`;

    return new Promise<string>((resolve, reject) => {
      resolve(fileName);
    });
  }

  backLogin() {
    this._navCtrl.navigateBack('/login');
  }
}

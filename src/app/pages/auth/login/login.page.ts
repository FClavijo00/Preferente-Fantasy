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
  IonItem,
  IonLabel,
  IonIcon,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  LoadingController,
  ToastController,
  IonInput,
  NavController,
  IonSpinner,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
} from 'ionicons/icons';
import { ToastService } from '../../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth-service.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],

  imports: [
    IonSpinner,
    IonButton,
    IonIcon,
    IonContent,
    IonInput,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  standalone: true,
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private _navCtrl = inject(NavController);
  private _toastService = inject(ToastService);
  private _authService = inject(AuthService);

  loadingSpinner = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  loginForm: FormGroup = new FormGroup({});

  // Estado del formulario mediante señales
  email = signal<string>('');
  password = signal<string>('');

  // Validaciones reactivas computadas
  isEmailValid = computed(() => {
    const val = this.email().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  });

  isPasswordValid = computed(() => {
    return this.password().length >= 6;
  });

  // Estado global de validez del formulario
  isFormValid = computed(() => this.isEmailValid() && this.isPasswordValid());

  constructor() {
    addIcons({
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
    });

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  navRegister() {
    this._navCtrl.navigateForward('/register');
  }

  toggleShowPassword() {
    this.showPassword.update((val) => !val);
  }

  async onLogin() {
    if (this.loginForm.invalid) {
      this._toastService.showErrorToast(
        'Por favor, completa todos los campos correctamente.',
      );
      return;
    }

    this.loadingSpinner.update((val) => true);

    try {
     const response = await firstValueFrom(this._authService.login(
      this.loginForm.value.email,
      this.loginForm.value.password
     ));
      console.log(response);
      if (response) {
        this.loadingSpinner.update((val) => false);
        this._toastService.showSuccessToast('Inicio de sesión exitoso.');
        this._navCtrl.navigateRoot('/recepcion', { replaceUrl: true });
      }
    } catch (error) {
      this.loadingSpinner.update((val) => false);
      this._toastService.showErrorToast('Error al iniciar sesión. Revisa tus credenciales.');
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
}

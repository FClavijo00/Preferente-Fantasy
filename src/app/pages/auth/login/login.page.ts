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
import { HttpErrorResponse } from '@angular/common/http';

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

  currentYear = signal<number>(new Date().getFullYear());

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
    this.loadingSpinner.set(true);
    if (this.loginForm.invalid) {
      this._toastService.showErrorToast(
        'Por favor, completa todos los campos correctamente.',
      );
      return;
    }

    try {
      this._authService.login(this.loginForm.value.email, this.loginForm.value.password).subscribe({
        next: async (resp: any) => {
          if (resp.ok) {
            this._authService.clearSession();

            this._authService.setSession(resp.data.usuario, resp.data.token);

            this.loadingSpinner.set(false);

            this._navCtrl.navigateRoot('/recepcion', { replaceUrl: true });
            this._toastService.showSuccessToast('Inicio de sesión exitoso.');
          }
        }, error: (error: HttpErrorResponse | any) => {
          if (error.status === 401) {
            this.loadingSpinner.set(false);
            this._toastService.showErrorToast('Usuario o contraseña incorrectos.. Revisa tus credenciales.');
          } else {
            this.loadingSpinner.set(false);
            this._toastService.showErrorToast('Ha ocurrido un error inesperado. Pruebe de nuevo.');
          }
        }
      });
    } finally {
      this.loadingSpinner.set(false);
    }
  }
}

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
  ModalController,
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
import { CambiarPasswordComponent } from '../../../shared/modals/cambiar-password/cambiar-password.component';
import { LoadingService } from '../../../core/services/loading.service';

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
  private _navCtrl = inject(NavController);
  private _toastService = inject(ToastService);
  private _authService = inject(AuthService);
  private _modalCtrl = inject(ModalController);
  private _loadingService = inject(LoadingService);

  loadingSpinner = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  loginForm: FormGroup = new FormGroup({});

  currentYear = signal<number>(new Date().getFullYear());

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

  async cambiarPass() {
    const modal = await this._modalCtrl.create({
      component: CambiarPasswordComponent,
      cssClass: 'card-modal-center',
      backdropDismiss: true,
    });
    await modal.present();
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
    this._loadingService.show('Iniciando sesión...');

    try {
      this._authService
        .login(this.loginForm.value.email, this.loginForm.value.password)
        .subscribe({
          next: async (resp: any) => {
            if (resp.ok) {
              this._authService.clearSession();

              this._authService.setSession(resp.data.usuario, resp.data.token);

              this.loadingSpinner.set(false);
              this._loadingService.hide();

              /* if (resp.data.usuario.rol_id === 1) {
                this._navCtrl.navigateRoot('/recepcion', { replaceUrl: true });
                this._toastService.showSuccessToast(
                  'Inicio de sesión exitoso.',
                );
              } */
              this._navCtrl.navigateRoot('/recepcion', { replaceUrl: true });
              this._toastService.showSuccessToast('Inicio de sesión exitoso.');
            }
          },
          error: (error: HttpErrorResponse | any) => {
            if (error.status === 401) {
              this.loadingSpinner.set(false);
              this._loadingService.hide();
              this._toastService.showErrorToast(
                error.error.message ||
                  'Credenciales erroneas. Pruebe de nuevo.',
              );
            } else {
              this.loadingSpinner.set(false);
              this._loadingService.hide();
              this._toastService.showErrorToast(
                'Ha ocurrido un error inesperado. Pruebe de nuevo.',
              );
            }
          },
        });
    } finally {
      this.loadingSpinner.set(false);
    }
  }
}

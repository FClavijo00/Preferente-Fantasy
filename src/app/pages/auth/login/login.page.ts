import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/ion-content';
import { IonInput } from '@ionic/angular/ion-input';
import { IonInputPasswordToggle } from '@ionic/angular/ion-input-password-toggle';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { NavController } from '@ionic/angular/nav-controller';
import { addIcons } from 'ionicons';
import { arrowBackOutline, lockClosedOutline, mailOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth-service.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [RouterLink, ReactiveFormsModule, IonContent, IonInput, IonInputPasswordToggle, IonButton, IonIcon],
})
export class LoginPage {
  private _fb = inject(FormBuilder);
  private _navCtrl = inject(NavController);
  private _toastService = inject(ToastService);
  private _authService = inject(AuthService);
  private _loadingService = inject(LoadingService);

  readonly enviando = signal(false);
  readonly anioActual = new Date().getFullYear();

  readonly loginForm = this._fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    addIcons({ arrowBackOutline, mailOutline, lockClosedOutline });
  }

  async onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this._toastService.showErrorToast('Revisa los campos marcados.');
      return;
    }
    if (this.enviando()) return;

    const { email, password } = this.loginForm.getRawValue();
    this.enviando.set(true);
    this._loadingService.show('Iniciando sesión...');

    try {
      await this._authService.iniciarSesion(email.trim(), password);
      this._navCtrl.navigateRoot('/recepcion', { replaceUrl: true });
      this._toastService.showSuccessToast('¡Bienvenido de nuevo!');
    } catch (error) {
      const err = error as HttpErrorResponse;
      this._toastService.showErrorToast(
        err.status === 401
          ? err.error?.message || 'Correo o contraseña incorrectos.'
          : 'No se ha podido iniciar sesión. Inténtalo de nuevo.',
      );
    } finally {
      this._loadingService.hide();
      this.enviando.set(false);
    }
  }
}

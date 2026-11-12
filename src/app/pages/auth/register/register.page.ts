import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IonContent } from '@ionic/angular/ion-content';
import { IonInput } from '@ionic/angular/ion-input';
import { IonInputPasswordToggle } from '@ionic/angular/ion-input-password-toggle';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { NavController } from '@ionic/angular/nav-controller';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cameraOutline,
  footballOutline,
  lockClosedOutline,
  mailOutline,
  personCircleOutline,
} from 'ionicons/icons';
import { CropModalComponent } from '../../../shared/components/crop-modal/crop-modal.component';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth-service.service';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [RouterLink, ReactiveFormsModule, IonContent, IonInput, IonInputPasswordToggle, IonButton, IonIcon],
})
export class RegisterPage {
  private _fb = inject(FormBuilder);
  private _navCtrl = inject(NavController);
  private _modalCtrl = inject(ModalController);
  private _toastService = inject(ToastService);
  private _authService = inject(AuthService);
  private _loadingService = inject(LoadingService);

  readonly enviando = signal(false);
  readonly avatarPreview = signal<string | null>(null);

  readonly registerForm = this._fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    club: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    foto: this._fb.control<File | null>(null),
  });

  constructor() {
    addIcons({
      arrowBackOutline,
      cameraOutline,
      footballOutline,
      lockClosedOutline,
      mailOutline,
      personCircleOutline,
    });
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const modal = await this._modalCtrl.create({
      component: CropModalComponent,
      componentProps: { imageChangedEvent: event },
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) {
      this.avatarPreview.set(data.croppedImageBase64);
      this.registerForm.patchValue({
        foto: data.croppedImageFile,
      });
    }

    // Limpiamos el input para poder volver a elegir la misma imagen
    input.value = '';
  }

  async onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this._toastService.showErrorToast('Revisa los campos marcados.');
      return;
    }
    if (this.enviando()) return;

    const { username, club, email, password, foto } = this.registerForm.getRawValue();
    const emailLimpio = email.trim();

    const formData = new FormData();
    formData.append('username', username.trim());
    formData.append('club', club.trim());
    formData.append('email', emailLimpio);
    formData.append('password', password);
    // El nombre del fichero lo pone el servidor
    if (foto) formData.append('foto', foto, 'foto.webp');

    this.enviando.set(true);
    this._loadingService.show('Creando tu cuenta...');

    try {
      await firstValueFrom(this._authService.register(formData));
    } catch (error) {
      const err = error as HttpErrorResponse;
      this._toastService.showErrorToast(err.error?.message || 'No se ha podido crear la cuenta. Inténtalo de nuevo.');
      this._loadingService.hide();
      this.enviando.set(false);
      return;
    }

    // Cuenta creada: iniciamos sesión directamente para no obligar a reescribir los datos
    try {
      await this._authService.iniciarSesion(emailLimpio, password);
      this._navCtrl.navigateRoot('/recepcion', { replaceUrl: true });
      this._toastService.showSuccessToast('¡Cuenta creada! Bienvenido a Preferente Fantasy.');
    } catch {
      this._navCtrl.navigateRoot('/login', { replaceUrl: true });
      this._toastService.showSuccessToast('Cuenta creada. Ya puedes iniciar sesión.');
    } finally {
      this._loadingService.hide();
      this.enviando.set(false);
    }
  }
}

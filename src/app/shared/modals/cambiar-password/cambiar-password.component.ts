import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  ModalController,
  IonButton
} from '@ionic/angular';
import { AuthService } from '../../../core/services/auth-service.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-cambiar-password',
  templateUrl: './cambiar-password.component.html',
  styleUrls: ['./cambiar-password.component.scss'],
  imports: [IonButton,
    IonCard,
    IonInput,
    IonCardContent,
    ReactiveFormsModule],
})
export class CambiarPasswordComponent {
  private _modalCtrl = inject(ModalController);
  private _fb = inject(FormBuilder);
  private _authService = inject(AuthService);
  private _toastService = inject(ToastService);
  private _loadingService = inject(LoadingService);

  public cambiarPasswordForm = this._fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmarPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {

  }

  cambiarPassword() {
    let formValues = this.cambiarPasswordForm.value
    if (formValues.password !== formValues.confirmarPassword) {
      this._toastService.showErrorToast('Las contraseñas no coinciden.');
      return;
    }
    this._loadingService.show();
    let data = {
      email: this.cambiarPasswordForm.value.email,
      password: this.cambiarPasswordForm.value.password,
    };

    this._authService.cambiarPass(data).subscribe((resp: any) => {
      if (resp.ok) {
        this._loadingService.hide();
        this._toastService.showSuccessToast(resp.message);
        this._modalCtrl.dismiss();
      }
    })
  } 
}

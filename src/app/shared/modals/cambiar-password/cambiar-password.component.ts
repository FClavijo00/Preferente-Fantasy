import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonInput } from '@ionic/angular/ion-input';
import { IonInputPasswordToggle } from '@ionic/angular/ion-input-password-toggle';
import { ModalController } from '@ionic/angular/modal-controller';
import { IonButton } from '@ionic/angular/ion-button';
import { AuthService } from '../../../core/services/auth-service.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingService } from '../../../core/services/loading.service';

/** Valida que la nueva contraseña y su confirmación coincidan. */
const passwordsCoinciden = (group: AbstractControl): ValidationErrors | null => {
  const nueva = group.get('passwordNueva')?.value;
  const confirmar = group.get('confirmarPassword')?.value;
  return nueva && confirmar && nueva !== confirmar ? { noCoinciden: true } : null;
};

@Component({
  selector: 'app-cambiar-password',
  templateUrl: './cambiar-password.component.html',
  styleUrls: ['./cambiar-password.component.scss'],
  imports: [IonButton, IonCard, IonInput, IonInputPasswordToggle, IonCardContent, ReactiveFormsModule],
})
export class CambiarPasswordComponent {
  private _modalCtrl = inject(ModalController);
  private _fb = inject(FormBuilder);
  private _authService = inject(AuthService);
  private _toastService = inject(ToastService);
  private _loadingService = inject(LoadingService);

  public enviando = signal(false);

  public cambiarPasswordForm = this._fb.nonNullable.group(
    {
      passwordActual: ['', [Validators.required]],
      passwordNueva: ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', [Validators.required]],
    },
    { validators: passwordsCoinciden },
  );

  cambiarPassword() {
    if (this.cambiarPasswordForm.invalid) {
      this.cambiarPasswordForm.markAllAsTouched();
      if (this.cambiarPasswordForm.hasError('noCoinciden')) {
        this._toastService.showErrorToast('Las contraseñas nuevas no coinciden.');
      }
      return;
    }
    if (this.enviando()) return;

    const { passwordActual, passwordNueva } = this.cambiarPasswordForm.getRawValue();
    this.enviando.set(true);
    this._loadingService.show('Cambiando contraseña...');

    this._authService.cambiarPass({ passwordActual, passwordNueva }).subscribe({
      next: (resp: any) => {
        this._loadingService.hide();
        this.enviando.set(false);
        this._toastService.showSuccessToast(resp?.message || 'Contraseña cambiada.');
        this._modalCtrl.dismiss();
      },
      error: (error: HttpErrorResponse) => {
        this._loadingService.hide();
        this.enviando.set(false);
        this._toastService.showErrorToast(error.error?.message || 'No se pudo cambiar la contraseña.');
      },
    });
  }
}

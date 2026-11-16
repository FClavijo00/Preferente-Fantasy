import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { IonIcon } from '@ionic/angular/ion-icon';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, closeOutline, eyeOffOutline, eyeOutline, keyOutline, lockClosedOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth-service.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingService } from '../../../core/services/loading.service';

/** Valida que la nueva contraseña y su confirmación coincidan. */
const passwordsCoinciden = (group: AbstractControl): ValidationErrors | null => {
  const nueva = group.get('passwordNueva')?.value;
  const confirmar = group.get('confirmarPassword')?.value;
  return nueva && confirmar && nueva !== confirmar ? { noCoinciden: true } : null;
};

type CampoPassword = 'passwordActual' | 'passwordNueva' | 'confirmarPassword';

/**
 * Cambiar contraseña. Sheet en el móvil / tarjeta en el escritorio.
 *
 *   modalCtrl.create({ component: CambiarPasswordComponent, ...opcionesModalAuto() })
 */
@Component({
  selector: 'app-cambiar-password',
  templateUrl: './cambiar-password.component.html',
  styleUrls: ['./cambiar-password.component.scss'],
  imports: [IonIcon, ReactiveFormsModule],
})
export class CambiarPasswordComponent {
  private _modalCtrl = inject(ModalController);
  private _fb = inject(FormBuilder);
  private _authService = inject(AuthService);
  private _toastService = inject(ToastService);
  private _loadingService = inject(LoadingService);

  readonly enviando = signal(false);
  readonly visibles = signal<Record<CampoPassword, boolean>>({
    passwordActual: false,
    passwordNueva: false,
    confirmarPassword: false,
  });

  readonly form = this._fb.nonNullable.group(
    {
      passwordActual: ['', [Validators.required]],
      passwordNueva: ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', [Validators.required]],
    },
    { validators: passwordsCoinciden },
  );

  constructor() {
    addIcons({ checkmarkCircleOutline, closeOutline, eyeOffOutline, eyeOutline, keyOutline, lockClosedOutline });
  }

  alternarVisible(campo: CampoPassword) {
    this.visibles.update((v) => ({ ...v, [campo]: !v[campo] }));
  }

  invalido(campo: CampoPassword): boolean {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }

  cambiarPassword() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.enviando()) return;

    const { passwordActual, passwordNueva } = this.form.getRawValue();
    this.enviando.set(true);
    this._loadingService.show('Cambiando contraseña...');

    this._authService.cambiarPass({ passwordActual, passwordNueva }).subscribe({
      next: (resp) => {
        this._loadingService.hide();
        this.enviando.set(false);
        this._toastService.showSuccessToast(resp?.message || 'Contraseña cambiada.');
        this._modalCtrl.dismiss(null, 'confirm');
      },
      error: (error: HttpErrorResponse) => {
        this._loadingService.hide();
        this.enviando.set(false);
        this._toastService.showErrorToast(error.error?.message || 'No se pudo cambiar la contraseña.');
      },
    });
  }

  cerrar() {
    this._modalCtrl.dismiss(null, 'cancel');
  }
}

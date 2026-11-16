import { Component, computed, inject, Input, signal } from '@angular/core';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonContent } from '@ionic/angular/ion-content';
import { IonIcon } from '@ionic/angular/ion-icon';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { atOutline, cameraOutline, checkmarkCircleOutline, closeOutline, shieldOutline } from 'ionicons/icons';
import { AuthService, Usuario } from '../../../core/services/auth-service.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../core/services/toast.service';
import { CropModalComponent } from '../../components/crop-modal/crop-modal.component';

/**
 * Editar perfil: foto (con recorte), nombre del club y nombre de usuario.
 * Al guardar deja el usuario nuevo en la sesión (AuthService) y cierra con role 'confirm'.
 *
 *   modalCtrl.create({ component: EditarPerfilComponent, ...opcionesModalAlto(),
 *                      componentProps: { userData: usuario } })
 */
@Component({
  selector: 'app-editar-perfil',
  templateUrl: './editar-perfil.component.html',
  styleUrls: ['./editar-perfil.component.scss'],
  imports: [IonHeader, IonContent, IonIcon],
})
export class EditarPerfilComponent {
  @Input({ required: true }) set userData(u: Usuario | null) {
    this._original = u;
    this.club.set(u?.nombre_club ?? '');
    this.usuario.set(u?.nombre_usuario ?? '');
    this.imagenPreview.set(u?.image_url || null);
  }

  private _original: Usuario | null = null;
  private _modalCtrl = inject(ModalController);
  private _authService = inject(AuthService);
  private _loadingService = inject(LoadingService);
  private _toastService = inject(ToastService);

  readonly club = signal('');
  readonly usuario = signal('');
  readonly imagenPreview = signal<string | null>(null);
  readonly foto = signal<File | null>(null);
  readonly enviando = signal(false);
  /** Los errores se enseñan al salir del campo o al intentar guardar */
  readonly tocado = signal({ club: false, usuario: false });

  readonly clubValido = computed(() => this.club().trim().length >= 3);
  readonly usuarioValido = computed(() => this.usuario().trim().length >= 3);
  readonly hayCambios = computed(
    () =>
      !!this.foto() ||
      this.club().trim() !== (this._original?.nombre_club ?? '') ||
      this.usuario().trim() !== (this._original?.nombre_usuario ?? ''),
  );

  constructor() {
    addIcons({ atOutline, cameraOutline, checkmarkCircleOutline, closeOutline, shieldOutline });
  }

  onTexto(campo: 'club' | 'usuario', event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    (campo === 'club' ? this.club : this.usuario).set(valor);
  }

  tocar(campo: 'club' | 'usuario') {
    this.tocado.update((t) => ({ ...t, [campo]: true }));
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
      this.imagenPreview.set(data.croppedImageBase64);
      this.foto.set(data.croppedImageFile);
    }
    input.value = '';
  }

  guardar() {
    this.tocado.set({ club: true, usuario: true });
    if (!this.clubValido() || !this.usuarioValido() || !this.hayCambios() || this.enviando()) return;

    const formData = new FormData();
    formData.append('nombre_club', this.club().trim());
    formData.append('nombre_usuario', this.usuario().trim());
    // El nombre del fichero lo pone el servidor (y el usuario sale del token, no del id)
    const foto = this.foto();
    if (foto) formData.append('foto', foto, 'foto.webp');

    this.enviando.set(true);
    this._loadingService.show('Guardando cambios...');
    this._authService.actualizarPerfil(formData).subscribe({
      next: (resp) => {
        this._loadingService.hide();
        this.enviando.set(false);
        this._authService.setSession(resp.data);
        this._toastService.showSuccessToast(resp.message || 'Perfil actualizado');
        this._modalCtrl.dismiss(resp.data, 'confirm');
      },
      error: (error) => {
        this._loadingService.hide();
        this.enviando.set(false);
        this._toastService.showErrorToast(error.error?.message || 'No se ha podido guardar el perfil');
      },
    });
  }

  cerrar() {
    this._modalCtrl.dismiss(null, 'cancel');
  }
}

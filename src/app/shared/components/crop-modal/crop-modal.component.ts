import { Component, inject, Input, signal } from '@angular/core';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonContent } from '@ionic/angular/ion-content';
import { IonFooter } from '@ionic/angular/ion-footer';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSpinner } from '@ionic/angular/ion-spinner';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Recorte de foto (registro, editar perfil, jugadores).
 * Devuelve con role 'confirm': { croppedImageBase64, croppedImageFile }.
 * El nombre del archivo da igual: el servidor pone el suyo.
 */
@Component({
  selector: 'app-crop-modal',
  templateUrl: './crop-modal.component.html',
  styleUrls: ['./crop-modal.component.scss'],
  imports: [IonHeader, IonContent, IonFooter, IonButton, IonIcon, IonSpinner, ImageCropperComponent],
})
export class CropModalComponent {
  private modalCtrl = inject(ModalController);
  private toastService = inject(ToastService);

  @Input() imageChangedEvent: Event | null = null;
  croppedImageBase64: string | null = null;
  croppedImageFile: File | null = null;

  readonly cargando = signal(true);

  constructor() {
    addIcons({ closeOutline });
  }

  imageCropped(event: ImageCroppedEvent) {
    if (event.objectUrl && event.blob) {
      this.croppedImageBase64 = event.objectUrl;
      this.croppedImageFile = new File([event.blob], 'foto.webp', { type: 'image/webp' });
    }
  }

  errorCarga() {
    this.toastService.showErrorToast('No se ha podido abrir la imagen. Prueba con otra.');
    this.cancelar();
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirmar() {
    if (!this.croppedImageFile) return;
    this.modalCtrl.dismiss(
      {
        croppedImageBase64: this.croppedImageBase64,
        croppedImageFile: this.croppedImageFile,
      },
      'confirm',
    );
  }
}

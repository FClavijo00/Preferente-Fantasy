import { Component, inject, Input, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  ModalController,
} from '@ionic/angular';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'app-crop-modal',
  templateUrl: './crop-modal.component.html',
  styleUrls: ['./crop-modal.component.scss'],
  imports: [
    IonContent,
    IonButton,
    IonButtons,
    IonTitle,
    IonToolbar,
    IonHeader,
    ImageCropperComponent,
  ],
})
export class CropModalComponent implements OnInit {
  private modalCtrl = inject(ModalController);

  @Input() imageChangedEvent: Event | null = null;
  croppedImageBase64: string | null = null;
  croppedImageFile: File | null = null;

  imageCropped(event: ImageCroppedEvent) {
    if (event.objectUrl && event.blob) {
      this.croppedImageBase64 = event.objectUrl;
      this.croppedImageFile = new File([event.blob], `avatar_${Date.now()}.webp`, { type: 'image/webp' });
    }
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }


  confirmar() {
    this.modalCtrl.dismiss(
      {
        croppedImageBase64: this.croppedImageBase64,
        croppedImageFile: this.croppedImageFile
      },
      'confirm');
  }

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit() { }
}

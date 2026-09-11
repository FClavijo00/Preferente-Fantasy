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

  imageCropped(event: ImageCroppedEvent) {
    // La imagen ya viene recortada y redimensionada exactamente a 300x300
    this.croppedImageBase64 = event.objectUrl || null;
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirmar() {
    this.modalCtrl.dismiss(this.croppedImageBase64, 'confirm');
  }

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit() {}
}

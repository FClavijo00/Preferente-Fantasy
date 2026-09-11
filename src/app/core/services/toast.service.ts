import { inject, Service } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';

@Service()
export class ToastService {
  private _toastCtrl = inject(ToastController);

  constructor() {
    addIcons({
        checkmarkCircleOutline,
        closeCircleOutline
    })
  }

  async showSuccessToast(message: string) {
    const toast = await this._toastCtrl.create({
      message,
      duration: 1500,
      color: 'success',
      position: 'bottom',
      mode: 'ios',
      icon: 'checkmark-circle-outline'
    });
    toast.present();
  }

  async showErrorToast(message: string) {
    const toast = await this._toastCtrl.create({
      message,
      duration: 1500,
      color: 'danger',
      position: 'bottom',
      mode: 'ios',
      icon: 'close-circle-outline'
    });
    toast.present();
  }
}

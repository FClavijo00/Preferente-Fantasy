import { Component, inject, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  checkmarkCircle,
  closeOutline,
  downloadOutline,
  ellipsisVertical,
  logoAndroid,
  logoApple,
  phonePortraitOutline,
  shareOutline,
  toggle,
} from 'ionicons/icons';
import { ToastService } from '../../../core/services/toast.service';
import {
  detectarDispositivo,
  Dispositivo,
  estaInstalada,
  instalarDirecto,
  puedeInstalarDirecto,
} from '../../../core/utils/instalar-app';

interface Paso {
  texto: string;
  /** Lo que hay que pulsar, dibujado como un botón */
  boton?: { icono: string; texto?: string };
}

/**
 * Instalar la app en la pantalla de inicio: pasos para iPhone y Android, con selector de dispositivo
 * (abre en el del usuario). En Chrome/Edge con aviso de instalación disponible, botón de un toque.
 *
 *   modalCtrl.create({ component: InstalarAppComponent, ...opcionesModalAuto() })
 */
@Component({
  selector: 'app-instalar-app',
  templateUrl: './instalar-app.component.html',
  styleUrls: ['./instalar-app.component.scss'],
  imports: [IonIcon],
})
export class InstalarAppComponent {
  private _modalCtrl = inject(ModalController);
  private _toastService = inject(ToastService);

  readonly dispositivo = signal<Dispositivo>(detectarDispositivo());
  readonly instalada = estaInstalada();
  readonly directo = signal(puedeInstalarDirecto());

  readonly pasos: Record<Dispositivo, Paso[]> = {
    ios: [
      { texto: 'Abre Preferente Fantasy en Safari (o en Chrome).' },
      {
        texto: 'Pulsa el botón Compartir: abajo en el iPhone, arriba en el iPad.',
        boton: { icono: 'share-outline' },
      },
      {
        texto: 'Baja y pulsa «Añadir a pantalla de inicio». Si no aparece, búscalo en «Ver más».',
        boton: { icono: 'add-circle-outline', texto: 'Añadir a pantalla de inicio' },
      },
      {
        texto: 'Si aparece «Abrir como app web», déjalo activado y pulsa «Añadir».',
        boton: { icono: 'toggle', texto: 'Abrir como app web' },
      },
      { texto: 'Listo: abre la app desde su icono en la pantalla de inicio.' },
    ],
    android: [
      { texto: 'Abre Preferente Fantasy en Chrome.' },
      {
        texto: 'Pulsa el menú de los tres puntos, arriba a la derecha.',
        boton: { icono: 'ellipsis-vertical' },
      },
      {
        texto: 'Pulsa «Instalar aplicación» o «Añadir a pantalla de inicio» y confirma con «Instalar».',
        boton: { icono: 'download-outline', texto: 'Instalar aplicación' },
      },
      {
        texto: 'En Samsung Internet: menú ≡ → «Añadir página a» → «Pantalla de inicio».',
      },
      { texto: 'Listo: abre la app desde su icono en la pantalla de inicio o en el cajón de apps.' },
    ],
  };

  constructor() {
    addIcons({
      addCircleOutline,
      checkmarkCircle,
      closeOutline,
      downloadOutline,
      ellipsisVertical,
      logoAndroid,
      logoApple,
      phonePortraitOutline,
      shareOutline,
      toggle,
    });
  }

  async instalar() {
    const ok = await instalarDirecto();
    this.directo.set(puedeInstalarDirecto());
    if (ok) {
      this._toastService.showSuccessToast('¡App instalada! Ya la tienes en tu pantalla de inicio.');
      this._modalCtrl.dismiss(null, 'confirm');
    }
  }

  cerrar() {
    this._modalCtrl.dismiss();
  }
}

import { Component, inject, Input, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  ModalController,
  IonContent,
  IonIcon,
  IonInput,
  IonToggle,
  IonItem,
  IonLabel,
  IonBadge,
  IonAvatar,
  IonList,
  AlertController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { keyOutline, trashOutline, trophyOutline } from 'ionicons/icons';
import { LoadingService } from '../../../core/services/loading.service';
import { LigasService } from '../../../core/services/ligas.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-editar-liga',
  templateUrl: './editar-liga.component.html',
  styleUrls: ['./editar-liga.component.scss'],
  imports: [
    IonList,
    IonAvatar,
    IonBadge,
    IonLabel,
    IonItem,
    IonIcon,
    IonContent,
    IonTitle,
    IonButton,
    IonButtons,
    IonToolbar,
    IonHeader,
    ReactiveFormsModule,
    IonInput,
    IonToggle,
  ],
})
export class EditarLigaComponent implements OnInit {
  @Input() userData: any;
  @Input() ligaData: any;
  @Input() ligaUsers: any;

  private _modalCtrl = inject(ModalController);
  private _fb = inject(FormBuilder);
  private _alertCtrl = inject(AlertController);
  private _loadingService = inject(LoadingService);
  private _ligasService = inject(LigasService);
  private _toastService = inject(ToastService);

  ligaForm!: FormGroup;

  creadorLigaId = signal<number>(1); // ID del creador para mostrar el badge
  listaUsuarios = signal<any>([]);

  constructor() {
    addIcons({
      trophyOutline,
      keyOutline,
      trashOutline,
    });
  }

  async confirmarEliminarUsuario(usuario: any) {
    const alert = await this._alertCtrl.create({
      mode: 'ios',
      backdropDismiss: false,
      header: `Eliminar al usuario:  ${usuario.nombre_usuario}`,
      message: `¿Deseas eliminar al usuario de la liga: ${this.ligaData?.nombre_liga}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.eliminarUsuarioLiga(usuario);
          },
        },
      ],
    });

    await alert.present();
  }

  cerrarModal() {
    this._modalCtrl.dismiss(null, 'cancel');
  }

  onChangePrivada(event: any) {
    this.ligaForm.get('privada')?.setValue(event.detail.checked);

    if (event.detail.checked) {
      this.ligaForm.get('codigo_acceso')?.enable();
      this.ligaForm
        .get('codigo_acceso')
        ?.setValidators([Validators.required, this.codigoAccesoValidator()]);
    } else {
      this.ligaForm.get('codigo_acceso')?.disable();
      this.ligaForm.get('codigo_acceso')?.clearValidators();
      this.ligaForm.get('codigo_acceso')?.setValue('');
    }

    this.ligaForm.get('codigo_acceso')?.updateValueAndValidity();
  }

  codigoAccesoValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      if (!value) return null;

      // Acepta letras mayúsculas (A-Z) y números (0-9) exactamente 4 veces
      const regex = /^PF-[A-Z0-9]{4}$/;
      const valid = regex.test(value);

      return valid ? null : { formatoInvalido: true };
    };
  }

  searchUsuarioCreador() {
    let creador = this.ligaUsers.find(
      (u: any) => u.usuario_id === this.ligaData.creado_por,
    );
    this.creadorLigaId.set(creador.usuario_id);
  }

  eliminarUsuarioLiga(usuario: any) {
    this._loadingService.show();
    let data = {
      liga_id: this.ligaData.id,
      user_id: usuario.usuario_id,
    };
    this._ligasService.eliminarUsuarioLiga(data).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this.listaUsuarios.set(
            this.ligaUsers.filter(
              (u: any) => u.usuario_id !== usuario.usuario_id,
            ),
          );

          this._loadingService.hide();
          this._toastService.showSuccessToast(resp.message);
        }
      },
      error: (error: any) => {
        this._loadingService.hide();
        this._toastService.showErrorToast(error.message);
      },
    });
  }

  guardarCambios() {
    if (this.ligaForm.invalid) {
      this.ligaForm.markAllAsTouched();
      return;
    }

    //this._loadingService.show();
    let data = {
      liga_id: this.ligaData.id,
      nombre_liga: this.ligaForm.get('nombre_liga')?.value,
      privada: this.ligaForm.get('privada')?.value,
      codigo_acceso: this.ligaForm.get('codigo_acceso')?.value,
    };

    this._ligasService.editarLiga(data).subscribe({
      next: (resp: any) => {
        if (resp.ok) {
          this._loadingService.hide();
          this._toastService.showSuccessToast(resp.message);
          this._modalCtrl.dismiss(data, 'confirm');
        }
      },
      error: (error: any) => {
        this._loadingService.hide();
        this._toastService.showErrorToast(error.error.message);
      },
    });
  }

  ngOnInit() {
    this.listaUsuarios.set(this.ligaUsers);
    this.ligaForm = this._fb.group({
      nombre_liga: [
        this.ligaData?.nombre_liga || '',
        [Validators.required, Validators.minLength(3)],
      ],
      codigo_acceso: [this.ligaData?.codigo_acceso || ''],
      privada: [this.ligaData?.privada || false, [Validators.required]],
    });

    this.searchUsuarioCreador();
  }
}

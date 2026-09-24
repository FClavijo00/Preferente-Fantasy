import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonInput,
  IonToggle,
  ModalController,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonItem,
  IonDatetimeButton,
  IonModal,
  IonDatetime,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { ToastService } from '../../../core/services/toast.service';
import { JornadasService } from '../../../core/services/jornadas-service';

@Component({
  selector: 'app-crear-jornada',
  templateUrl: './crear-jornada.component.html',
  styleUrls: ['./crear-jornada.component.scss'],
  imports: [
    IonModal,
    IonDatetime,
    IonDatetimeButton,
    IonItem,
    IonLabel,
    IonInput,
    IonContent,
    IonIcon,
    IonButton,
    IonButtons,
    IonTitle,
    IonToolbar,
    IonHeader,
    ReactiveFormsModule,
    IonSelect,
    IonSelectOption
],
})
export class CrearJornadaComponent {
  private _modalCtrl = inject(ModalController);
  private _fb = inject(FormBuilder);
  private _toastService = inject(ToastService);
  private _jornadasService = inject(JornadasService);

  public jornadaForm: FormGroup = new FormGroup({});
  constructor() {
    addIcons({
      closeCircleOutline,
      checkmarkCircleOutline
    });

    this.jornadaForm = this._fb.group({
      numero_jornada: [null,[Validators.required, Validators.min(1)]],
      fecha_inicio: [null, [Validators.required]],
      fecha_fin: [null,[Validators.required]],
      estado: [null, [Validators.required]],
    });
  }

  cerrarModal() {
    this._modalCtrl.dismiss();
  }

  crearJornada() {
    if (this.jornadaForm.invalid) {
      this._toastService.showErrorToast('Todos los campos son obligatorios');
      return;
    } 
    let data = {
      numero_jornada: this.jornadaForm.value.numero_jornada,
      fecha_inicio: this.jornadaForm.value.fecha_inicio,
      fecha_fin: this.jornadaForm.value.fecha_fin,
      estado: this.jornadaForm.value.estado
    }
    this._jornadasService.crearJornada(data).subscribe({
      next: (resp: any) => {
        if(resp.ok) {
          this._toastService.showSuccessToast('Jornada creada con exito');
          this._modalCtrl.dismiss(resp.data, 'confirm');
        }
      },
      error: (error) => {
        this._toastService.showErrorToast('Error al crear la jornada');
      },
    })
  }
}

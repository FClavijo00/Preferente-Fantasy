import { Component, inject, Input, OnInit, signal } from '@angular/core';
import {
  IonContent,
  IonTitle,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonButtons,
  ModalController,
  IonInput,
  IonLabel,
  IonItem,
  IonList,
  IonToggle,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  closeCircleOutline,
  documentTextOutline,
  globeOutline,
  peopleOutline,
  shieldCheckmarkOutline,
  trophyOutline,
} from 'ionicons/icons';
import { LigasService } from '../../../core/services/ligas.service';
import { AuthService } from '../../../core/services/auth-service.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export interface Ligas {
  id: number;
  nombre_liga: string;
  privada: boolean;
  codigo_acceso: string | null;
  nombre_competicion: string;
  total_participantes: number;
}

@Component({
  selector: 'app-crear-unir-campeonato',
  templateUrl: './crear-unir-campeonato.component.html',
  styleUrls: ['./crear-unir-campeonato.component.scss'],
  imports: [
    IonToggle,
    IonInput,
    IonButtons,
    IonIcon,
    IonButton,
    IonToolbar,
    IonHeader,
    IonTitle,
    IonContent,
    ReactiveFormsModule
],
})
export class CrearUnirCampeonatoComponent implements OnInit {
  @Input() modo: 'crear' | 'unir' = 'crear';

  private _modalCtrl = inject(ModalController);
  private _ligasService = inject(LigasService);
  private _authService = inject(AuthService);
  private _toastService = inject(ToastService);
  private _formBuilder = inject(FormBuilder);

  public user: any | null = null;

  public campeonatoForm: FormGroup = new FormGroup({});

  public medianteCodigo = signal<boolean>(false);
  public codigo = signal<string>('PF-');
  public medianteLigasAbiertas = signal<boolean>(false);
  public ligasAbiertas = signal<Ligas[]>([]);

  constructor() {
    addIcons({
      closeCircleOutline,
      documentTextOutline,
      peopleOutline,
      shieldCheckmarkOutline,
      globeOutline,
      trophyOutline,
    });

    this.campeonatoForm = this._formBuilder.group({
      nombre_campeonato: ['', [Validators.required, Validators.minLength(3)]],
      privado: [false, [Validators.required]],
    });
  }

  abrirLigasAbiertas() {
    this.medianteCodigo.set(false);
    this.medianteLigasAbiertas.set(true);
  }
  abrirFormularioCodigo() {
    this.medianteCodigo.set(true);
    this.medianteLigasAbiertas.set(false);
  }

  unirseALigaXCodigo(codigo: string) {
    let data = {
      codigo: codigo,
      userId: this.user.id,
    };
    this._ligasService.unirseALiga(data).subscribe({
      next: (data: any) => {
        console.log(data);
      },
      error: (error) => {
        if (error.status === 404) {
          this._toastService.showErrorToast(error.error.message);
        }
      },
    });
  }

  unirseALiga(liga: any) {
    let data = {
      ligaId: liga.id,
      userId: this.user.id,
    };
    this._ligasService.unirseALiga(data).subscribe({
      next: (data: any) => {
        this._toastService.showSuccessToast(data.message);
        this._modalCtrl.dismiss(data, 'confirm');
      },
      error: (error) => {
        if (error.status === 404) {
          this._toastService.showErrorToast(error.error.message);
          this.cerrarModal();
        }
      },
    });
  }

  crearCampeonato() {
    let data = {
      nombre_campeonato: this.campeonatoForm.value.nombre_campeonato,
      privado: this.campeonatoForm.value.privado,
      userId: this.user.id,
    };
    this._ligasService.crearLiga(data).subscribe({
      next: (data: any) => {
        this._toastService.showSuccessToast(data.message);
        this._modalCtrl.dismiss(data, 'confirm');
      },
      error: (error) => {
        if (error.status === 404) {
          this._toastService.showErrorToast(error.error.message);
          this.cerrarModal();
        }
      },
    });
  }

  async cargarLigasAbiertas() {
    this._ligasService.getLigasAbiertas().subscribe({
      next: (res: any) => {
        if (res.ok) {
          this.ligasAbiertas.set(res.data);
        }
      },
    });
  }

  cerrarModal() {
    this._modalCtrl.dismiss();
  }

  ngOnInit() {
    this.user = this._authService.getUser();
    if (this.modo === 'unir') {
      this.cargarLigasAbiertas();
    }
  }
}

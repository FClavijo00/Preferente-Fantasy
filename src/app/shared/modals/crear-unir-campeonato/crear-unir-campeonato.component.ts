import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSegment } from '@ionic/angular/ion-segment';
import { IonSegmentButton } from '@ionic/angular/ion-segment-button';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonSearchbar } from '@ionic/angular/ion-searchbar';
import { IonSpinner } from '@ionic/angular/ion-spinner';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  closeOutline,
  copyOutline,
  globeOutline,
  keyOutline,
  lockClosedOutline,
  peopleOutline,
  shareSocialOutline,
  trophyOutline,
} from 'ionicons/icons';
import { LigaAbierta, LigaCreada, LigasService } from '../../../core/services/ligas.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingService } from '../../../core/services/loading.service';
import { compartirLiga, copiarTexto } from '../../../core/utils/compartir-liga';

type PestanaUnir = 'codigo' | 'abiertas';

/** El prefijo PF- va fijo en pantalla: el usuario solo escribe los 4 caracteres. */
const PREFIJO_CODIGO = 'PF-';

@Component({
  selector: 'app-crear-unir-campeonato',
  templateUrl: './crear-unir-campeonato.component.html',
  styleUrls: ['./crear-unir-campeonato.component.scss'],
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSearchbar,
    IonSpinner,
  ],
})
export class CrearUnirCampeonatoComponent implements OnInit {
  // Lo pasa recepción con componentProps (Ionic lo asigna como propiedad, no como input signal)
  @Input() modo: 'crear' | 'unir' = 'crear';

  private _modalCtrl = inject(ModalController);
  private _ligasService = inject(LigasService);
  private _toastService = inject(ToastService);
  private _loadingService = inject(LoadingService);
  private _fb = inject(FormBuilder);

  /** Hay una petición en curso (bloquea los botones para no enviar dos veces). */
  readonly enviando = signal(false);

  // ---------- Crear ----------
  readonly crearForm = this._fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(40)]],
    privada: [true],
  });
  /** Liga recién creada: cambia el modal a la pantalla de "¡creada!" con el código. */
  readonly ligaCreada = signal<LigaCreada | null>(null);

  // ---------- Unirse ----------
  readonly pestana = signal<PestanaUnir>('codigo');
  readonly prefijoCodigo = PREFIJO_CODIGO;
  readonly codigoControl = this._fb.nonNullable.control('', [
    Validators.required,
    Validators.pattern(/^[A-Z0-9]{4}$/),
  ]);

  readonly ligasAbiertas = signal<LigaAbierta[]>([]);
  readonly cargandoAbiertas = signal(false);
  readonly errorAbiertas = signal(false);
  readonly busqueda = signal('');
  readonly uniendoId = signal<number | null>(null);

  readonly ligasFiltradas = computed(() => {
    const texto = normalizar(this.busqueda());
    if (!texto) return this.ligasAbiertas();
    return this.ligasAbiertas().filter((liga) => normalizar(liga.nombre_liga).includes(texto));
  });

  constructor() {
    addIcons({
      checkmarkCircle,
      closeOutline,
      copyOutline,
      globeOutline,
      keyOutline,
      lockClosedOutline,
      peopleOutline,
      shareSocialOutline,
      trophyOutline,
    });
  }

  ngOnInit() {
    if (this.modo === 'unir') this.cargarLigasAbiertas();
  }

  // ===================== Crear =====================

  async crearCampeonato() {
    if (this.crearForm.invalid) {
      this.crearForm.markAllAsTouched();
      return;
    }

    const { nombre, privada } = this.crearForm.getRawValue();
    const resp = await this.enviar(
      this._ligasService.crearLiga({ nombre_campeonato: nombre.trim(), privado: privada }),
      'No se ha podido crear el campeonato.',
    );
    if (resp) this.ligaCreada.set(resp.data);
  }

  async copiarCodigo(codigo: string) {
    const ok = await copiarTexto(codigo);
    if (ok) this._toastService.showSuccessToast(`Código ${codigo} copiado`);
    else this._toastService.showErrorToast('No se ha podido copiar el código');
  }

  async compartir(liga: LigaCreada) {
    if (!liga.codigo_acceso) return;
    const resultado = await compartirLiga(liga.nombre_liga, liga.codigo_acceso);
    if (resultado === 'copiado') this._toastService.showSuccessToast(`Código ${liga.codigo_acceso} copiado`);
  }

  // ===================== Unirse =====================

  cambiarPestana(valor: unknown) {
    if (valor === 'codigo' || valor === 'abiertas') this.pestana.set(valor);
  }

  /**
   * Deja solo los 4 caracteres del código, en mayúsculas, mientras se escribe o se pega.
   * "ab12", "pf ab12" o "PF-AB12" acaban todos en "AB12".
   */
  normalizarCodigo(input: HTMLInputElement) {
    let limpio = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    // Si han pegado el código entero (PF-XXXX), quitamos el prefijo
    if (limpio.length > 4 && limpio.startsWith('PF')) limpio = limpio.slice(2);
    limpio = limpio.slice(0, 4);
    if (limpio !== input.value) input.value = limpio;
    if (limpio !== this.codigoControl.value) this.codigoControl.setValue(limpio);
  }

  async unirsePorCodigo() {
    if (this.codigoControl.invalid) {
      this.codigoControl.markAsTouched();
      return;
    }
    const resp = await this.enviar(
      this._ligasService.unirseALiga({ codigo: PREFIJO_CODIGO + this.codigoControl.value }),
      'No se ha podido unir al campeonato.',
    );
    if (resp) this.terminarUnion(resp.message);
  }

  async unirseALigaAbierta(liga: LigaAbierta) {
    this.uniendoId.set(liga.id);
    const resp = await this.enviar(
      this._ligasService.unirseALiga({ ligaId: liga.id }),
      'No se ha podido unir al campeonato.',
    );
    this.uniendoId.set(null);
    if (resp) this.terminarUnion(resp.message);
  }

  async cargarLigasAbiertas() {
    this.cargandoAbiertas.set(true);
    this.errorAbiertas.set(false);
    try {
      const res = await firstValueFrom(this._ligasService.getLigasAbiertas());
      this.ligasAbiertas.set(res.data);
    } catch {
      this.errorAbiertas.set(true);
    } finally {
      this.cargandoAbiertas.set(false);
    }
  }

  private terminarUnion(mensaje?: string) {
    this._toastService.showSuccessToast(mensaje || 'Te has unido al campeonato');
    this._modalCtrl.dismiss(null, 'confirm');
  }

  // ===================== Común =====================

  /**
   * Lanza la petición mostrando el estado de envío. Si falla, enseña el mensaje del
   * backend (p. ej. "Ya formas parte de esta liga") y deja el modal abierto para corregir.
   */
  private async enviar<T>(peticion: Observable<T>, mensajeError: string): Promise<T | null> {
    if (this.enviando()) return null;
    this.enviando.set(true);
    this._loadingService.show(this.modo === 'crear' ? 'Creando campeonato...' : 'Uniéndote al campeonato...');
    try {
      return await firstValueFrom(peticion);
    } catch (error) {
      const err = error as HttpErrorResponse;
      this._toastService.showErrorToast(err.error?.message || mensajeError);
      return null;
    } finally {
      this._loadingService.hide();
      this.enviando.set(false);
    }
  }

  cerrarModal() {
    // Si ya se creó una liga, recepción tiene que recargar su lista
    this._modalCtrl.dismiss(null, this.ligaCreada() ? 'confirm' : 'cancel');
  }
}

/** Minúsculas y sin tildes, para que buscar "malaga" encuentre "Málaga". */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

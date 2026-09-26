import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonButton,
  IonIcon,
  IonBadge,
  IonContent,
  IonTitle,
  IonHeader,
  IonToolbar,
  IonButtons,
  ModalController,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonListHeader,
  IonCardTitle,
} from '@ionic/angular';
import { PartidosService } from '../../../core/services/partidos.service';
import { EquiposService } from '../../../core/services/equipos-service';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  closeCircleOutline,
  add,
  trash,
  saveOutline,
} from 'ionicons/icons';
import { LoadingService } from '../../../core/services/loading.service';
export interface JugadorSimple {
  id: number;
  nombre: string;
  apellidos: string;
  apodo?: string;
  posicion: string;
}

@Component({
  selector: 'app-acta-partido',
  standalone: true,
  imports: [
    IonButtons,
    IonToolbar,
    IonHeader,
    IonTitle,
    IonContent,
    CommonModule,
    ReactiveFormsModule,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon
],
  templateUrl: './acta-partido.component.html',
  styleUrls: ['./acta-partido.component.scss'],
})
export class ActaPartidoComponent implements OnInit {
  private _fb = inject(FormBuilder);

  @Input() partido: any;
  @Input() actaExistente?: any;

  private _partidosService = inject(PartidosService);
  private _equiposService = inject(EquiposService);
  private _modalCtrl = inject(ModalController);
  private _loadingService = inject(LoadingService);

  equipos = signal<any>([]);
  plantillaLocal: JugadorSimple[] = [];
  plantillaVisitante: JugadorSimple[] = [];
  plantillasJuntas: JugadorSimple[] = [];

  actaForm!: FormGroup;

  // Configuración de slots por defecto
  private readonly SLOTS_TITULARES_DEFAULT = 11;
  private readonly SLOTS_SUPLENTES_DEFAULT = 7;

  constructor() {
    addIcons({
      add,
      trash,
      saveOutline,
      closeCircleOutline,
      checkmarkCircleOutline,
    });
  }

  private crearEstructuraBaseFormulario() {
    this.actaForm = this._fb.group({
      partido_id: [this.partido.id || null, Validators.required],
      titulares_local: this._fb.array<FormGroup>([]),
      suplentes_local: this._fb.array<FormGroup>([]),
      titulares_visitante: this._fb.array<FormGroup>([]),
      suplentes_visitante: this._fb.array<FormGroup>([]),
      goles_local_list: this._fb.array([]),
      goles_visitante_list: this._fb.array([]),
      jugador_destacado_id: [null],
    });
  }

  private async initForm() {
    this.actaForm = this._fb.group({
      // 11 Titulares por equipo
      titulares_local: this.crearSlotsJugadores(11),
      titulares_visitante: this.crearSlotsJugadores(11),
      // 7 Suplentes por equipo
      suplentes_local: this.crearSlotsJugadores(7),
      suplentes_visitante: this.crearSlotsJugadores(7),
      // Listas dinámicas para goleadores
      goles_local_list: this._fb.array([]),
      goles_visitante_list: this._fb.array([]),
    });
  }

  private obtenerActa() {
    this._loadingService.show();
    this._partidosService.obtenerActa(this.partido.partido_id).subscribe({
      next: (acta: any) => {
        this.actaExistente = acta;
        this.cargarDatosEnFormulario(acta);
        this._loadingService.hide();
      },
      error: (error) => {
        this.generarSlotsVacios();
        this._loadingService.hide();
      },
    });
  }

  private generarSlotsVacios() {
    this.poblarSlots('titulares_local', [], this.SLOTS_TITULARES_DEFAULT);
    this.poblarSlots('suplentes_local', [], this.SLOTS_SUPLENTES_DEFAULT);
    this.poblarSlots('titulares_visitante', [], this.SLOTS_TITULARES_DEFAULT);
    this.poblarSlots('suplentes_visitante', [], this.SLOTS_SUPLENTES_DEFAULT);

    this.sincronizarGoles('goles_local_list', this.partido.goles_local || 0);
    this.sincronizarGoles(
      'goles_visitante_list',
      this.partido.goles_visitante || 0,
    );
  }

  private cargarDatosEnFormulario(acta: any) {
    this.actaForm.patchValue({
      partido_id: acta.partido_id || this.partido.partido_id,
      jugador_destacado_id: acta.jugador_destacado_id || null,
    });

    // Cargar alineaciones (asegurando el mínimo de slots visibles)
    this.poblarSlots(
      'titulares_local',
      acta.titulares_local || [],
      this.SLOTS_TITULARES_DEFAULT,
    );
    this.poblarSlots(
      'suplentes_local',
      acta.suplentes_local || [],
      this.SLOTS_SUPLENTES_DEFAULT,
    );
    this.poblarSlots(
      'titulares_visitante',
      acta.titulares_visitante || [],
      this.SLOTS_TITULARES_DEFAULT,
    );
    this.poblarSlots(
      'suplentes_visitante',
      acta.suplentes_visitante || [],
      this.SLOTS_SUPLENTES_DEFAULT,
    );

    this.sincronizarGoles('goles_local_list', this.partido.goles_local || 0);
    this.sincronizarGoles(
      'goles_visitante_list',
      this.partido.goles_visitante || 0,
    );

    // Cargar eventos dinámicos (goles y tarjetas)
    this.poblarGoles('goles_local_list', acta.goles_local || []);
    this.poblarGoles('goles_visitante_list', acta.goles_visitante || []);

    this.poblarTarjetas('local', acta.tarjetas_local || []);
    this.poblarTarjetas('visitante', acta.tarjetas_visitante || []);
  }

  private poblarSlots(
    controlName: string,
    idsGuardados: number[],
    minSlots: number,
  ) {
    const array = this.getFormArray(controlName);
    array.clear();

    const totalSlots = Math.max(idsGuardados.length, minSlots);

    for (let i = 0; i < totalSlots; i++) {
      const jugadorId = idsGuardados[i] !== undefined ? idsGuardados[i] : null;
      array.push(
        this._fb.group({
          jugador_id: [jugadorId],
          amarilla1: [false],
          amarilla2: [false],
          roja: [false],
        }),
      );
    }
  }

  private poblarGoles(controlName: string, goles: any) {
    const array = this.getFormArray(controlName);
    array.clear();

    for (const gol of goles) {
      array.push(
        this._fb.group({
          jugador_id: [gol.jugador_id, Validators.required],
          equipo_id: [gol.equipo_id, Validators.required],
          tipo: [gol.tipo || 'NORMAL', Validators.required],
        }),
      );
    }
  }

  private poblarTarjetas(equipo: 'local' | 'visitante', tarjetas: any[]) {
    // 1. Seleccionamos los FormArray según el equipo que estemos procesando
    const titulares =
      equipo === 'local'
        ? this.getFormArray('titulares_local')
        : this.getFormArray('titulares_visitante');

    const suplentes =
      equipo === 'local'
        ? this.getFormArray('suplentes_local')
        : this.getFormArray('suplentes_visitante');

    // 2. Recorremos cada tarjeta que viene de la API para ese equipo
    for (const tarjeta of tarjetas) {
      const jugadorId = tarjeta.jugador_id;

      // Buscamos al jugador primero en titulares y, si no está, en suplentes
      let controlJugador = titulares.controls.find(
        (control) => control.get('jugador_id')?.value === jugadorId,
      );

      if (!controlJugador) {
        controlJugador = suplentes.controls.find(
          (control) => control.get('jugador_id')?.value === jugadorId,
        );
      }

      // 3. Si encontramos al jugador en la convocatoria, le aplicamos la sanción
      if (controlJugador) {
        const tipo = tarjeta.tipo; // Ej: 'AMARILLA', 'DOBLE_AMARILLA', 'ROJA'

        if (tipo === 'AMARILLA') {
          // Si ya tiene la primera amarilla marcada, marcamos la segunda
          if (controlJugador.get('amarilla1')?.value) {
            controlJugador.patchValue({ amarilla2: true });
          } else {
            controlJugador.patchValue({ amarilla1: true });
          }
        } else if (tipo === 'DOBLE AMARILLA') {
          controlJugador.patchValue({
            amarilla1: true,
            amarilla2: true,
          });
        } else if (tipo === 'ROJA') {
          controlJugador.patchValue({ roja: true });
        }
      }
    }
  }

  // --- Métodos de apoyo para el HTML / FormArray ---

  getFormArray(nombre: string): FormArray {
    return this.actaForm.get(nombre) as FormArray;
  }

  agregarGol() {
    this.getFormArray('goles').push(
      this._fb.group({
        jugador_id: [null, Validators.required],
        equipo_id: [null, Validators.required],
        tipo: ['NORMAL', Validators.required],
      }),
    );
  }

  eliminarGol(index: number) {
    this.getFormArray('goles').removeAt(index);
  }

  agregarTarjeta() {
    this.getFormArray('tarjetas').push(
      this._fb.group({
        jugador_id: [null, Validators.required],
        equipo_id: [null, Validators.required],
        tipo: ['AMARILLA', Validators.required],
      }),
    );
  }

  eliminarTarjeta(index: number) {
    this.getFormArray('tarjetas').removeAt(index);
  }

  private crearSlotsJugadores(cantidad: number): FormArray {
    const array = this._fb.array<FormGroup>([]);
    for (let i = 0; i < cantidad; i++) {
      array.push(
        this._fb.group({
          jugador_id: [null],
          amarilla1: [false],
          amarilla2: [false],
          roja: [false],
        }),
      );
    }
    return array as FormArray;
  }

  // Genera o ajusta dinámicamente los campos según los goles del marcador
  sincronizarGoles(
    campo: 'goles_local_list' | 'goles_visitante_list',
    cantidad: number,
  ) {
    const array = this.actaForm.get(campo) as FormArray;
    while (array.length !== cantidad) {
      if (array.length < cantidad) {
        array.push(
          this._fb.group({
            jugador_id: [null, Validators.required],
            tipo: ['NORMAL'], // 'NORMAL', 'PENALTI', 'PROPIA'
          }),
        );
      } else {
        array.removeAt(array.length - 1);
      }
    }
  }

  async getEquipos() {
    this._equiposService.getEquipos().subscribe({
      next: (data: any) => {
        this.equipos.set(data);

        this.cargarPlantillas();
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  async cargarPlantillas() {
    this.equipos().map((equipo: any) => {
      if (equipo.id === this.partido.equipo_local_id) {
        this.plantillaLocal = equipo.jugadores;
      }
      if (equipo.id === this.partido.equipo_visitante_id) {
        this.plantillaVisitante = equipo.jugadores;
      }
    });
    this.plantillasJuntas = [
      ...this.plantillaLocal,
      ...this.plantillaVisitante,
    ];
  }

  async cargarActa() {
    this._partidosService.obtenerActa(this.partido.partido_id).subscribe({
      next: (acta: any) => {
        // 1. Cargar Titulares y Suplentes Local
        this.rellenarSlots('titulares_local', acta.titulares_local);
        this.rellenarSlots('suplentes_local', acta.suplentes_local);

        // 2. Cargar Titulares y Suplentes Visitante
        this.rellenarSlots('titulares_visitante', acta.titulares_visitante);
        this.rellenarSlots('suplentes_visitante', acta.suplentes_visitante);

        // 3. Cargar Goles
        this.rellenarGoles('goles_local_list', acta.goles);
        this.rellenarGoles('goles_visitante_list', acta.goles);

        // 4. Cargar Tarjetas
        //this.rellenarTarjetas(acta.tarjetas);

        // 5. Cargar Destacado
        if (acta.jugador_destacado_id) {
          this.actaForm.patchValue({
            jugador_destacado_id: acta.jugador_destacado_id,
          });
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  private rellenarSlots(controlName: string, idsGuardados: number[]) {
    const array = this.actaForm.get(controlName) as FormArray;
    array.clear(); // Limpia los slots por defecto
    // Asegura que siempre haya un número mínimo de slots cargando los elegidos primero
    const totalSlots = Math.max(idsGuardados.length, 7); // Mínimo 7 slots, o los que hayan guardados

    for (let i = 0; i < totalSlots; i++) {
      const jugadorId = idsGuardados[i] !== undefined ? idsGuardados[i] : null;
      array.push(
        this._fb.group({
          jugador_id: [jugadorId],
          amarilla1: [false],
          amarilla2: [false],
          roja: [false],
        }),
      );
    }
  }

  private rellenarGoles(campo: string, goles: any[]) {
    const golesArray = this.actaForm.get(campo) as FormArray;
    golesArray.clear();

    for (const gol of goles) {
      golesArray.push(
        this._fb.group({
          jugador_id: [gol.jugador_id],
          equipo_id: [gol.equipo_id],
          tipo: [gol.tipo],
        }),
      );
    }
  }

  private rellenarTarjetas(tarjetas: any[]) {
    const tarjetasArray = this.actaForm.get('tarjetas') as FormArray;
    //tarjetasArray.clear();

    for (const tarjeta of tarjetas) {
      tarjetasArray.push(
        this._fb.group({
          jugador_id: [tarjeta.jugador_id],
          equipo_id: [tarjeta.equipo_id],
          tipo: [tarjeta.tipo],
        }),
      );
    }
  }

  obtenerNombreFormateado(j: JugadorSimple): string {
    if (j.apodo) return `${j.apodo} (${j.posicion})`;
    return `${j.nombre} ${j.apellidos} (${j.posicion})`;
  }

  // ==================== MÉTODOS PARA EXTRAER Y LIMPIAR LOS DATOS ====================

  getArray(nombre: string): FormArray {
    return this.actaForm.get(nombre) as FormArray;
  }

  private extraerIdsSeleccionados(formArrayName: string): number[] {
    const controles = this.getArray(formArrayName).value;
    return controles
      .map((c: any) => c.jugador_id)
      .filter((id: any) => id !== null && id !== undefined);
  }

  private extraerTarjetas(formArrayName: string, equipoId: number) {
    const controles = this.getArray(formArrayName).value;
    const tarjetas: any[] = [];

    controles.forEach((c: any) => {
      if (c.jugador_id) {
        if (c.amarilla1)
          tarjetas.push({
            jugador_id: c.jugador_id,
            equipo_id: equipoId,
            tipo: 'AMARILLA',
          });
        if (c.amarilla2)
          tarjetas.push({
            jugador_id: c.jugador_id,
            equipo_id: equipoId,
            tipo: 'DOBLE AMARILLA',
          });
        if (c.roja)
          tarjetas.push({
            jugador_id: c.jugador_id,
            equipo_id: equipoId,
            tipo: 'ROJA',
          });
      }
    });

    return tarjetas;
  }

  async cerrarActa() {
    this._loadingService.show();

    const titularesLocal = this.extraerIdsSeleccionados('titulares_local');
    const suplentesLocal = this.extraerIdsSeleccionados('suplentes_local');
    const titularesVisitante = this.extraerIdsSeleccionados(
      'titulares_visitante',
    );
    const suplentesVisitante = this.extraerIdsSeleccionados(
      'suplentes_visitante',
    );
    const tarjetas = [
      ...this.extraerTarjetas('titulares_local', this.partido.equipo_local_id),
      ...this.extraerTarjetas('suplentes_local', this.partido.equipo_local_id),
      ...this.extraerTarjetas(
        'titulares_visitante',
        this.partido.equipo_visitante_id,
      ),
      ...this.extraerTarjetas(
        'suplentes_visitante',
        this.partido.equipo_visitante_id,
      ),
    ];
    const golesLocal = this.getArray('goles_local_list').value.map(
      (g: any) => ({
        jugador_id: g.jugador_id,
        equipo_id: this.partido.equipo_local_id,
        tipo: g.tipo,
      }),
    );

    const golesVisitante = this.getArray('goles_visitante_list').value.map(
      (g: any) => ({
        jugador_id: g.jugador_id,
        equipo_id: this.partido.equipo_visitante_id,
        tipo: g.tipo,
      }),
    );

    const jugadorDestacado = this.actaForm.value.jugador_destacado_id || null;

    // 4. Mapeamos la carga útil (Payload) final que enviaremos al Backend
    const payloadActa = {
      partido_id: this.partido.partido_id,
      titulares_local: titularesLocal,
      suplentes_local: suplentesLocal,
      titulares_visitante: titularesVisitante,
      suplentes_visitante: suplentesVisitante,
      tarjetas: tarjetas,
      goles: [...golesLocal, ...golesVisitante],
      jugador_destacado_id: jugadorDestacado,
    };

    console.log('Payload a enviar al Backend:', payloadActa);

    this._partidosService.cerrarActa(payloadActa).subscribe({
      next: (data: any) => {
        this._modalCtrl.dismiss(data, 'confirm');
        this._loadingService.hide();
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  cerrarModal() {
    this._modalCtrl.dismiss();
  }

  async ngOnInit() {
    this.getEquipos();
    this.crearEstructuraBaseFormulario();

    if (this.partido.tiene_acta === true) {
      this.obtenerActa();
    } else {
      this.generarSlotsVacios();
    }
  }
}

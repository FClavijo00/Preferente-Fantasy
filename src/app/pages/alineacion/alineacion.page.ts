import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NgTemplateOutlet } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { IonContent } from '@ionic/angular/ion-content';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { ModalController } from '@ionic/angular/modal-controller';
import { addIcons } from 'ionicons';
import {
  add,
  checkmarkCircle,
  lockClosedOutline,
  medkit,
  refreshOutline,
  warning,
} from 'ionicons/icons';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { LoadingService } from '../../core/services/loading.service';
import { JornadasService, SiguienteJornada } from '../../core/services/jornadas-service';
import { JugadorDisponible } from '../../core/services/jugadores-service';
import { EquiposService } from '../../core/services/equipos-service';
import { FormacionesService } from '../../core/services/formaciones.service';
import { LigasService } from '../../core/services/ligas.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth-service.service';
import { EstadoAlineacionService } from '../../core/services/estado-alineacion.service';
import {
  AlineacionesService,
  JugadorPlantilla,
  RolHueco,
} from '../../core/services/alineaciones.service';
import { SelectJugadoresComponent } from '../../shared/modals/select-jugadores/select-jugadores.component';
import {
  MiniCalendarioComponent,
  PartidoMini,
} from '../../shared/components/mini-calendario/mini-calendario.component';
import { AvatarJugadorComponent } from '../../shared/components/avatar-jugador/avatar-jugador.component';
import { opcionesModalAuto } from '../../core/utils/modal-auto';

/** Lo que se pinta en un hueco del campo */
export interface JugadorHueco {
  id: number;
  nombre: string;
  apellidos: string | null;
  apodo: string | null;
  foto: string | null;
  posicion: RolHueco;
  lesionado: boolean;
  /** false = dado de baja: hay que cambiarlo para poder guardar */
  activo: boolean;
  equipo_id: number;
  equipo_nombre: string;
  equipo_escudo: string | null;
}

export interface Hueco {
  index: number;
  rol: RolHueco;
  jugador: JugadorHueco | null;
}

interface Formacion {
  id: number;
  formacion: string;
}

interface EquipoLimpio {
  id: number;
  nombre: string;
  escudo: string | null;
}

const JUGADORES_ONCE = 11;
const MAX_POR_EQUIPO = 2;
/** Orden de las líneas en el campo (de arriba abajo) y de los huecos (index) */
const LINEAS: RolHueco[] = ['DEL', 'MED', 'DEF', 'POR'];
const FECHA_CIERRE = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

/** Rol de cada hueco de una formación "DEF-MED-DEL": delanteros, medios, defensas y portero. */
const rolesFormacion = (formacion: string): RolHueco[] => {
  const [def, med, del] = formacion.split('-').map(Number);
  return [
    ...Array<RolHueco>(del).fill('DEL'),
    ...Array<RolHueco>(med).fill('MED'),
    ...Array<RolHueco>(def).fill('DEF'),
    'POR',
  ];
};

@Component({
  selector: 'app-alineacion',
  templateUrl: './alineacion.page.html',
  styleUrls: ['./alineacion.page.scss'],
  imports: [
    IonContent,
    IonIcon,
    IonSkeletonText,
    NgTemplateOutlet,
    HeaderComponent,
    MiniCalendarioComponent,
    AvatarJugadorComponent,
  ],
})
export class AlineacionPage {
  private _loadingService = inject(LoadingService);
  private _jornadasService = inject(JornadasService);
  private _modalCtrl = inject(ModalController);
  private _equiposService = inject(EquiposService);
  private _formacionesService = inject(FormacionesService);
  private _ligasService = inject(LigasService);
  private _toastService = inject(ToastService);
  private _authService = inject(AuthService);
  private _alineacionesService = inject(AlineacionesService);
  private _estadoAlineacion = inject(EstadoAlineacionService);

  readonly estado = signal<'cargando' | 'listo' | 'sin-jornada' | 'error'>('cargando');
  readonly formaciones = signal<Formacion[]>([]);
  readonly formacionId = signal<number | null>(null);
  readonly jornada = signal<SiguienteJornada | null>(null);
  readonly partidos = signal<PartidoMini[]>([]);
  readonly huecos = signal<Hueco[]>([]);
  readonly guardando = signal(false);
  /** Si no había nada guardado, número de la jornada de la que se ha cargado la propuesta */
  readonly copiadaDe = signal<number | null>(null);
  private equipos: EquipoLimpio[] = [];

  /** Lo último guardado (o cargado), para saber si hay cambios */
  private readonly firmaGuardada = signal('');
  /** Liga con la que se cargó la pantalla: si cambia, se recarga */
  private ligaCargada: number | null = null;

  /** Momento (ms, reloj del móvil) en que cierra la jornada, a partir de los segundos del servidor */
  private readonly cierre = signal<number | null>(null);
  private readonly ahora = signal(Date.now());

  readonly restante = computed(() => {
    const c = this.cierre();
    return c === null ? null : c - this.ahora();
  });

  /** Se puede editar: jornada pendiente y antes de la hora de cierre */
  readonly abierta = computed(() => {
    const r = this.restante();
    return this.jornada()?.estado === 'PENDIENTE' && r !== null && r > 0;
  });

  /** "sáb, 14 nov · 15:00" */
  readonly fechaCierre = computed(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/.exec(this.jornada()?.fecha_limite ?? '');
    if (!m) return null;
    return `${FECHA_CIERRE.format(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])))} · ${m[4]}`;
  });

  readonly porLinea = computed(() => {
    const huecos = this.huecos();
    return LINEAS.map((rol) => ({ rol, huecos: huecos.filter((h) => h.rol === rol) }));
  });

  readonly alineados = computed(() => this.huecos().filter((h) => h.jugador).length);

  readonly conteoEquipos = computed(() => {
    const mapa = new Map<number, number>();
    for (const h of this.huecos()) {
      if (h.jugador) mapa.set(h.jugador.equipo_id, (mapa.get(h.jugador.equipo_id) ?? 0) + 1);
    }
    return mapa;
  });

  readonly bajas = computed(() => this.huecos().filter((h) => h.jugador && !h.jugador.activo).length);

  private readonly firma = computed(() =>
    `${this.formacionId()}|${this.huecos().map((h) => h.jugador?.id ?? '-').join(',')}`,
  );
  readonly hayCambios = computed(() => this.firma() !== this.firmaGuardada());

  readonly puedeGuardar = computed(
    () => this.abierta() && this.hayCambios() && this.alineados() === JUGADORES_ONCE && this.bajas() === 0 && !this.guardando(),
  );

  constructor() {
    addIcons({ add, checkmarkCircle, lockClosedOutline, medkit, refreshOutline, warning });
    const reloj = setInterval(() => this.ahora.set(Date.now()), 15_000);
    inject(DestroyRef).onDestroy(() => clearInterval(reloj));
  }

  ionViewWillEnter() {
    this.ahora.set(Date.now());
    const liga = this._ligasService.ligaSeleccionada()?.id ?? null;
    // Se recarga al entrar, salvo que haya cambios sin guardar en la misma liga
    if (liga !== this.ligaCargada || !this.hayCambios()) this.cargar();
  }

  async cargar() {
    const liga = this._ligasService.ligaSeleccionada();
    const usuario = this._authService.currentUser();
    this.ligaCargada = liga?.id ?? null;
    if (this.estado() !== 'listo') this.estado.set('cargando');
    this._loadingService.show();
    try {
      const [formaciones, equipos, jornada] = await Promise.all([
        this.formaciones().length
          ? Promise.resolve(this.formaciones())
          : firstValueFrom(this._formacionesService.getFormaciones()).then((r: any) => (r?.data ?? []) as Formacion[]),
        this.equipos.length
          ? Promise.resolve(this.equipos)
          : firstValueFrom(this._equiposService.getEquiposLimpios()).then((r: any) => (r?.data ?? []) as EquipoLimpio[]),
        firstValueFrom(this._jornadasService.getSiguienteJornada()).catch((e: HttpErrorResponse) => {
          if (e.status === 404) return null; // no quedan jornadas pendientes
          throw e;
        }),
      ]);
      this.formaciones.set(formaciones);
      this.equipos = equipos;

      if (!jornada || !liga || !usuario) {
        this.jornada.set(null);
        this.estado.set('sin-jornada');
        return;
      }
      this.jornada.set(jornada);
      this.cierre.set(Date.now() + jornada.segundos_restantes * 1000);
      this.ahora.set(Date.now());

      const [partidos, plantilla] = await Promise.all([
        firstValueFrom(this._jornadasService.cargarPartidosJornada(jornada.id))
          .then((r) => r.data ?? [])
          .catch(() => [] as PartidoMini[]),
        firstValueFrom(
          this._alineacionesService.cargarAlineacion({
            liga_id: liga.id,
            usuario_id: usuario.id,
            jornada_id: jornada.id,
            anterior: true,
          }),
        ),
      ]);
      this.partidos.set(partidos);

      const formacion = formaciones.find((f) => f.id === plantilla.formacion_id) ?? formaciones[0];
      this.formacionId.set(formacion?.id ?? null);
      this.huecos.set(
        formacion ? this.colocar(rolesFormacion(formacion.formacion), plantilla.jugadores) : [],
      );
      // La propuesta de una jornada anterior no está guardada: cuenta como cambio hasta guardarla
      const copiada = plantilla.existe ? null : (plantilla.de_jornada ?? null);
      this.copiadaDe.set(copiada);
      this.firmaGuardada.set(copiada === null ? this.firma() : '');
      this.estado.set('listo');
    } catch (error) {
      console.error('Error al cargar la alineación:', error);
      this.estado.set('error');
    } finally {
      this._loadingService.hide();
    }
  }

  /** Huecos de la formación con los jugadores guardados en su hueco_index */
  private colocar(roles: RolHueco[], guardados: JugadorPlantilla[]): Hueco[] {
    const porHueco = new Map(guardados.map((j) => [j.hueco_index, j]));
    return roles.map((rol, index) => {
      const j = porHueco.get(index);
      return { index, rol, jugador: j ? this.aHueco(j) : null };
    });
  }

  private aHueco(j: JugadorPlantilla | JugadorDisponible): JugadorHueco {
    return {
      id: j.id,
      nombre: j.nombre,
      apellidos: j.apellidos,
      apodo: j.apodo,
      foto: j.foto,
      posicion: j.posicion,
      lesionado: !!j.lesionado,
      activo: 'activo' in j ? j.activo !== false : true,
      equipo_id: j.equipo_id,
      equipo_nombre: j.equipo_nombre,
      equipo_escudo: j.equipo_escudo,
    };
  }

  /**
   * Cambia la formación manteniendo a cada jugador en su línea. Si en la nueva hay menos
   * huecos de una línea, se quedan fuera los últimos de esa línea.
   */
  cambiarFormacion(f: Formacion) {
    if (!this.abierta() || f.id === this.formacionId()) return;
    const porRol = new Map<RolHueco, JugadorHueco[]>(LINEAS.map((r) => [r, []]));
    for (const h of this.huecos()) if (h.jugador) porRol.get(h.jugador.posicion)?.push(h.jugador);

    const huecos = rolesFormacion(f.formacion).map((rol, index) => ({
      index,
      rol,
      jugador: porRol.get(rol)?.shift() ?? null,
    }));
    const fuera = [...porRol.values()].reduce((n, l) => n + l.length, 0);

    this.formacionId.set(f.id);
    this.huecos.set(huecos);
    if (fuera > 0) {
      this._toastService.showErrorToast(
        fuera === 1 ? 'Un jugador se ha quedado fuera con esta formación.' : `${fuera} jugadores se han quedado fuera con esta formación.`,
      );
    }
  }

  async abrirSelector(hueco: Hueco) {
    if (!this.abierta()) return;

    // El cupo por equipo sin contar al jugador que se va a cambiar
    const conteo = new Map(this.conteoEquipos());
    if (hueco.jugador) conteo.set(hueco.jugador.equipo_id, (conteo.get(hueco.jugador.equipo_id) ?? 1) - 1);

    const modal = await this._modalCtrl.create({
      component: SelectJugadoresComponent,
      ...opcionesModalAuto(),
      componentProps: {
        posicion: hueco.rol,
        idsExcluidos: this.huecos().flatMap((h) => (h.jugador ? [h.jugador.id] : [])),
        conteo,
        maxPorEquipo: MAX_POR_EQUIPO,
        equipos: this.equipos,
        puedeQuitar: !!hueco.jugador,
      },
    });
    await modal.present();

    const { data, role } = await modal.onDidDismiss<JugadorDisponible | null>();
    if (role === 'confirm' && data) this.asignar(hueco.index, this.aHueco(data));
    else if (role === 'quitar') this.asignar(hueco.index, null);
  }

  private asignar(index: number, jugador: JugadorHueco | null) {
    this.huecos.update((lista) => lista.map((h) => (h.index === index ? { ...h, jugador } : h)));
  }

  /** Apodo si lo tiene; si no, nombre y apellidos */
  nombre(j: JugadorHueco): string {
    return j.apodo?.trim() || `${j.nombre} ${j.apellidos ?? ''}`.trim();
  }

  async guardar() {
    const liga = this._ligasService.ligaSeleccionada();
    const jornada = this.jornada();
    const formacionId = this.formacionId();
    if (!this.puedeGuardar() || !liga || !jornada || formacionId === null) return;

    this.guardando.set(true);
    this._loadingService.show();
    try {
      await firstValueFrom(
        this._alineacionesService.guardarAlineacion({
          liga_id: liga.id,
          jornada_id: jornada.id,
          formacion_id: formacionId,
          jugadores: this.huecos().map((h) => ({ jugador_id: h.jugador!.id, posicion: h.rol, hueco_index: h.index })),
        }),
      );
      this.firmaGuardada.set(this.firma());
      this.copiadaDe.set(null);
      this._toastService.showSuccessToast('Alineación guardada.');
      // Quita (o actualiza) el aviso de "alineación sin hacer" de pestañas y recepción
      this._estadoAlineacion.cargar();
    } catch (e) {
      const error = e as HttpErrorResponse;
      this._toastService.showErrorToast(error.error?.message ?? 'Error al guardar la alineación.');
      // La jornada ya empezó: se recarga para mostrarla bloqueada
      if (error.status === 409) this.cargar();
    } finally {
      this.guardando.set(false);
      this._loadingService.hide();
    }
  }
}

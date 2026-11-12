import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSkeletonText } from '@ionic/angular/ion-skeleton-text';
import { ModalController } from '@ionic/angular/modal-controller';
import { AlertController } from '@ionic/angular/alert-controller';
import { HttpErrorResponse } from '@angular/common/http';
import { addIcons } from 'ionicons';
import {
  addOutline,
  createOutline,
  medkitOutline,
  peopleOutline,
  refreshOutline,
  searchOutline,
  trashOutline,
} from 'ionicons/icons';
import { Equipo, EquiposService } from '../../../../core/services/equipos-service';
import { JugadorAdmin, JugadoresService } from '../../../../core/services/jugadores-service';
import { CrearEditarJugadorComponent } from '../../../../shared/modals/crear-editar-jugador/crear-editar-jugador.component';
import { opcionesModalAuto } from '../../../../core/utils/modal-auto';
import { LoadingService } from '../../../../core/services/loading.service';
import { ToastService } from '../../../../core/services/toast.service';

type Posicion = JugadorAdmin['posicion'];

const TITULO_POSICION: Record<Posicion, string> = {
  POR: 'Porteros',
  DEF: 'Defensas',
  MED: 'Centrocampistas',
  DEL: 'Delanteros',
};

/** Minúsculas y sin tildes, para que buscar "nunez" encuentre "Núñez". */
const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

@Component({
  selector: 'app-jugadores-admin',
  templateUrl: './jugadores-admin.component.html',
  styleUrls: ['./jugadores-admin.component.scss'],
  imports: [IonButton, IonIcon, IonSkeletonText],
})
export class JugadoresAdminComponent implements OnInit {
  private _equiposService = inject(EquiposService);
  private _jugadoresService = inject(JugadoresService);
  private _modalCtrl = inject(ModalController);
  private _alertCtrl = inject(AlertController);
  private _loadingService = inject(LoadingService);
  private _toastService = inject(ToastService);

  readonly equipos = signal<Equipo[]>([]);
  readonly equipoId = signal<number | null>(null);
  readonly jugadores = signal<JugadorAdmin[]>([]);
  readonly busqueda = signal('');

  readonly estadoEquipos = signal<'cargando' | 'listo' | 'error'>('cargando');
  readonly estadoJugadores = signal<'cargando' | 'listo' | 'error'>('cargando');

  readonly equipo = computed(() => this.equipos().find((e) => e.id === this.equipoId()) ?? null);

  /** Jugadores (ya ordenados por el backend) filtrados por la búsqueda y agrupados por posición. */
  readonly grupos = computed(() => {
    const texto = normalizar(this.busqueda());
    const lista = texto
      ? this.jugadores().filter((j) => normalizar(`${this.nombre(j)} ${j.nombre} ${j.apellidos}`).includes(texto))
      : this.jugadores();
    return (Object.keys(TITULO_POSICION) as Posicion[])
      .map((posicion) => ({
        posicion,
        titulo: TITULO_POSICION[posicion],
        jugadores: lista.filter((j) => j.posicion === posicion),
      }))
      .filter((g) => g.jugadores.length > 0);
  });

  readonly resumen = computed(() => {
    const lista = this.jugadores();
    return {
      total: lista.length,
      inactivos: lista.filter((j) => j.activo === false).length,
      lesionados: lista.filter((j) => j.lesionado).length,
    };
  });

  constructor() {
    addIcons({ addOutline, createOutline, medkitOutline, peopleOutline, refreshOutline, searchOutline, trashOutline });
  }

  ngOnInit() {
    this.cargarEquipos();
  }

  async cargarEquipos() {
    this.estadoEquipos.set('cargando');
    try {
      const res = (await firstValueFrom(this._equiposService.getEquiposLimpios())) as { data: Equipo[] };
      this.equipos.set(res.data ?? []);
      this.estadoEquipos.set('listo');
      if (this.equipoId() === null && this.equipos().length > 0) this.seleccionarEquipo(this.equipos()[0].id);
    } catch {
      this.estadoEquipos.set('error');
    }
  }

  seleccionarEquipo(id: number) {
    if (this.equipoId() === id && this.estadoJugadores() === 'listo') return;
    this.equipoId.set(id);
    this.busqueda.set('');
    this.cargarJugadores();
  }

  async cargarJugadores() {
    const id = this.equipoId();
    if (id === null) return;
    this.estadoJugadores.set('cargando');
    try {
      const res = await firstValueFrom(this._jugadoresService.getJugadoresEquipoAdmin(id));
      // Si mientras tanto se eligió otro equipo, esta respuesta ya no vale
      if (this.equipoId() !== id) return;
      this.jugadores.set(res.data ?? []);
      this.estadoJugadores.set('listo');
    } catch {
      if (this.equipoId() === id) this.estadoJugadores.set('error');
    }
  }

  nombre(j: JugadorAdmin): string {
    return j.apodo?.trim() || `${j.nombre} ${j.apellidos ?? ''}`.trim();
  }

  /** Nombre completo como segunda línea, solo si se muestra por apodo. */
  nombreCompleto(j: JugadorAdmin): string | null {
    return j.apodo?.trim() ? `${j.nombre} ${j.apellidos ?? ''}`.trim() : null;
  }

  // ---------- Crear / editar (modal existente) ----------

  nuevoJugador() {
    // Se propone el equipo que se está viendo
    this.abrirModal({ modo: 'crear', equipo: this.equipo(), equipos: this.equipos() });
  }

  editarJugador(j: JugadorAdmin) {
    this.abrirModal({ modo: 'editar', jugador: j, equipo: this.equipo(), equipos: this.equipos() });
  }

  /**
   * Solo se borran jugadores sin historial (lo comprueba también el backend). Si ya ha jugado,
   * borrarlo quitaría puntos a los usuarios que lo alinearon: para eso está "Activo".
   */
  async eliminarJugador(j: JugadorAdmin) {
    if (j.tiene_historial) {
      this._toastService.showErrorToast(
        `${this.nombre(j)} ya tiene partidos, puntos o alineaciones: desactívalo desde "Editar" en lugar de borrarlo.`,
      );
      return;
    }

    const alert = await this._alertCtrl.create({
      mode: 'ios',
      cssClass: ['pf-alert', 'pf-alert-peligro'],
      header: `¿Eliminar a ${this.nombre(j)}?`,
      message: 'No tiene partidos ni puntos, así que no afecta a nadie. Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'destructive') return;

    this._loadingService.show('Eliminando jugador...');
    try {
      const resp = await firstValueFrom(this._jugadoresService.eliminarJugador(j.id));
      this._toastService.showSuccessToast(resp.message || 'Jugador eliminado');
      this.jugadores.update((lista) => lista.filter((x) => x.id !== j.id));
    } catch (error) {
      const err = error as HttpErrorResponse;
      this._toastService.showErrorToast(err.error?.message || 'No se ha podido eliminar el jugador');
    } finally {
      this._loadingService.hide();
    }
  }

  private async abrirModal(props: Record<string, unknown>) {
    const modal = await this._modalCtrl.create({
      component: CrearEditarJugadorComponent,
      componentProps: props,
      // Se ajusta al contenido: sheet en el móvil, tarjeta centrada en el escritorio
      ...opcionesModalAuto(),
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<{ equipo_id?: number }>();
    if (role !== 'confirm') return;

    // Si el jugador se creó o movió a otro equipo, se muestra ese equipo
    const equipoDestino = data?.equipo_id ? Number(data.equipo_id) : null;
    if (equipoDestino && equipoDestino !== this.equipoId()) {
      this.equipoId.set(equipoDestino);
    }
    this.cargarJugadores();
  }
}

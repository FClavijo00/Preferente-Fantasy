import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonSpinner } from '@ionic/angular/ion-spinner';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  caretDownOutline,
  caretUpOutline,
  chevronBackOutline,
  chevronForwardOutline,
  footballOutline,
  removeOutline,
} from 'ionicons/icons';
import {
  FilaClasificacionPublica,
  JornadaPublica,
  JugadorPublico,
  PartidoPublico,
  PublicoService,
} from '../../core/services/publico.service';
import { cargarAdsense } from '../../core/utils/adsense';

const SITE_NAME = 'Preferente Fantasy';
const LINEAS: JugadorPublico['posicion'][] = ['DEL', 'MED', 'DEF', 'POR'];

/** 'YYYY-MM-DD...' → Date local (sin conversiones de zona: la hora ya es la de España) */
const fechaLocal = (s: string) => {
  const [a, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, d);
};
const FMT_DIA = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const FMT_CORTO = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' });

/**
 * Página PÚBLICA de una jornada de la 1ª Andaluza de Jaén: resultados, clasificación, 11 ideal y
 * mejores jugadores. Sin sesión: es el contenido abierto para buscadores, AdSense y visitantes.
 * /jornada → la última publicada (la última con 11 ideal, que garantiza todas las actas).
 */
@Component({
  selector: 'app-jornada-publica',
  templateUrl: './jornada-publica.page.html',
  styleUrls: ['./jornada-publica.page.scss'],
  imports: [RouterLink, IonContent, IonHeader, IonToolbar, IonIcon, IonSpinner],
})
export class JornadaPublicaPage {
  private _publico = inject(PublicoService);
  private _title = inject(Title);
  private _meta = inject(Meta);

  /** Parámetro de la ruta /jornada/:numero (vacío en /jornada) */
  readonly numero = input<string>();

  readonly estado = signal<'cargando' | 'listo' | 'no-existe' | 'error'>('cargando');
  readonly datos = signal<JornadaPublica | null>(null);
  readonly anioActual = new Date().getFullYear();

  readonly anterior = computed(() => this.vecina(+1));
  readonly siguiente = computed(() => this.vecina(-1));

  /** "sábado 18 y domingo 19 de octubre" (a partir de las fechas de los partidos) */
  readonly fechas = computed(() => {
    const d = this.datos();
    const dias = [...new Set((d?.partidos ?? []).map((p) => p.fecha?.slice(0, 10)).filter(Boolean))].sort() as string[];
    if (dias.length === 0) return '';
    if (dias.length === 1) return FMT_DIA.format(fechaLocal(dias[0]));
    return `del ${FMT_CORTO.format(fechaLocal(dias[0]))} al ${FMT_CORTO.format(fechaLocal(dias[dias.length - 1]))}`;
  });

  /** El 11 ideal por líneas, de delanteros a portero (como se ve en un campo) */
  readonly lineasOnce = computed(() => {
    const jugadores = this.datos()?.once_ideal.jugadores ?? [];
    return LINEAS.map((pos) => jugadores.filter((j) => j.posicion === pos)).filter((l) => l.length > 0);
  });

  /** Crónica corta escrita a partir de los datos de la jornada */
  readonly resumen = computed(() => (this.datos() ? this.escribirResumen(this.datos()!) : []));

  constructor() {
    addIcons({
      arrowBackOutline,
      caretDownOutline,
      caretUpOutline,
      chevronBackOutline,
      chevronForwardOutline,
      footballOutline,
      removeOutline,
    });
    cargarAdsense();

    effect(() => {
      const n = this.numero();
      untracked(() => this.cargar(n ? Number(n) : undefined));
    });
  }

  async cargar(numero?: number) {
    if (numero !== undefined && (!Number.isInteger(numero) || numero < 1)) {
      this.estado.set('no-existe');
      return;
    }
    this.estado.set('cargando');
    try {
      const res = await firstValueFrom(this._publico.getJornada(numero));
      this.datos.set(res.data);
      this.estado.set('listo');
      this.actualizarSeo(res.data);
    } catch (e) {
      this.estado.set(e instanceof HttpErrorResponse && e.status === 404 ? 'no-existe' : 'error');
    }
  }

  ganador(p: PartidoPublico): 'local' | 'visitante' | 'empate' | null {
    if (p.goles_local === null || p.goles_visitante === null) return null;
    if (p.goles_local === p.goles_visitante) return 'empate';
    return p.goles_local > p.goles_visitante ? 'local' : 'visitante';
  }

  hora(p: PartidoPublico): string {
    return p.fecha ? p.fecha.slice(11, 16) : '';
  }

  movimiento(f: FilaClasificacionPublica): 'sube' | 'baja' | 'igual' {
    if (f.posicion_anterior === null || f.posicion_anterior === f.posicion) return 'igual';
    return f.posicion < f.posicion_anterior ? 'sube' : 'baja';
  }

  iniciales(nombre: string): string {
    return nombre
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }

  /** Jornada publicada más antigua (+1) o más reciente (-1) que la actual */
  private vecina(paso: 1 | -1): number | null {
    const d = this.datos();
    if (!d) return null;
    const i = d.jornadas.indexOf(d.jornada.numero);
    return d.jornadas[i + paso] ?? null;
  }

  private escribirResumen(d: JornadaPublica): string[] {
    const frases: string[] = [];
    const jugados = d.partidos.filter((p) => this.ganador(p) !== null);
    const empates = jugados.filter((p) => this.ganador(p) === 'empate').length;
    const victoriasFuera = jugados.filter((p) => this.ganador(p) === 'visitante').length;

    frases.push(
      `La jornada ${d.jornada.numero} de la 1ª Andaluza de Jaén dejó ${d.total_goles} goles en ${jugados.length} partidos` +
        ` (${(d.total_goles / Math.max(jugados.length, 1)).toLocaleString('es-ES', { maximumFractionDigits: 1 })} por partido),` +
        ` con ${victoriasFuera} ${victoriasFuera === 1 ? 'victoria' : 'victorias'} a domicilio y ${empates} ${empates === 1 ? 'empate' : 'empates'}.`,
    );

    // Resultado más abultado
    const goleada = [...jugados].sort(
      (a, b) =>
        Math.abs(b.goles_local! - b.goles_visitante!) - Math.abs(a.goles_local! - a.goles_visitante!) ||
        b.goles_local! + b.goles_visitante! - (a.goles_local! + a.goles_visitante!),
    )[0];
    if (goleada && Math.abs(goleada.goles_local! - goleada.goles_visitante!) >= 3) {
      frases.push(
        this.ganador(goleada) === 'local'
          ? `El resultado más abultado fue el ${goleada.goles_local}-${goleada.goles_visitante} de ${goleada.local.nombre} ante ${goleada.visitante.nombre}.`
          : `El resultado más abultado lo firmó ${goleada.visitante.nombre}, que ganó ${goleada.goles_visitante}-${goleada.goles_local} en el campo de ${goleada.local.nombre}.`,
      );
    }

    // Líder
    const lider = d.clasificacion[0];
    if (lider && lider.pj > 0) {
      const segundo = d.clasificacion[1];
      const ventaja = segundo ? lider.puntos - segundo.puntos : 0;
      const verbo = lider.posicion_anterior === 1 ? 'sigue líder' : 'se coloca líder';
      frases.push(
        `En la clasificación, ${lider.equipo} ${verbo} con ${lider.puntos} puntos` +
          (segundo
            ? ventaja > 0
              ? `, ${ventaja} ${ventaja === 1 ? 'punto' : 'puntos'} por delante de ${segundo.equipo}.`
              : `, empatado a puntos con ${segundo.equipo}.`
            : '.'),
      );
    }

    // Goleador y jugador con más puntos
    const maxGoles = d.goleadores_jornada[0]?.goles ?? 0;
    if (maxGoles >= 2) {
      const top = d.goleadores_jornada.filter((j) => j.goles === maxGoles);
      const nombres = top.slice(0, 3).map((j) => `${j.nombre} (${j.equipo})`);
      const lista =
        top.length > 3
          ? `${nombres.join(', ')} y ${top.length - 3} ${top.length - 3 === 1 ? 'jugador más' : 'jugadores más'}`
          : nombres.length > 1
            ? `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
            : nombres[0];
      const hazana = maxGoles === 2 ? 'un doblete' : maxGoles === 3 ? 'un hat-trick' : `${maxGoles} goles`;
      frases.push(`${lista} ${top.length > 1 ? 'firmaron' : 'firmó'} ${hazana}.`);
    }
    const mvp = d.mvp_jornada;
    if (mvp) {
      frases.push(
        `El jugador con más puntos en Preferente Fantasy fue ${mvp.nombre} (${mvp.equipo}), con ${mvp.puntos} puntos.`,
      );
    }
    const primero = d.ranking_puntos[0];
    const pichichi = d.ranking_goleadores[0];
    if (primero && pichichi) {
      frases.push(
        `En la temporada, ${primero.nombre} (${primero.equipo}) encabeza la clasificación de jugadores con ${primero.puntos} puntos` +
          ` y ${pichichi.nombre} (${pichichi.equipo}) es el máximo goleador con ${pichichi.goles} ${pichichi.goles === 1 ? 'gol' : 'goles'}.`,
      );
    }
    return frases;
  }

  private actualizarSeo(d: JornadaPublica) {
    const n = d.jornada.numero;
    const titulo = `Jornada ${n} de la 1ª Andaluza de Jaén: resultados, clasificación y 11 ideal | ${SITE_NAME}`;
    const lider = d.clasificacion[0];
    const descripcion =
      `Resultados de la jornada ${n} de la 1ª Andaluza de Jaén, clasificación actualizada` +
      (lider ? ` (líder: ${lider.equipo}, ${lider.puntos} puntos)` : '') +
      `, el 11 ideal y los jugadores con más puntos de la jornada.`;
    this._title.setTitle(titulo);
    this._meta.updateTag({ name: 'description', content: descripcion });
    this._meta.updateTag({ property: 'og:title', content: titulo });
    this._meta.updateTag({ property: 'og:description', content: descripcion });
    this._meta.updateTag({ name: 'twitter:title', content: titulo });
    this._meta.updateTag({ name: 'twitter:description', content: descripcion });
  }
}

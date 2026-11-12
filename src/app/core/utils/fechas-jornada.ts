/**
 * Las fechas de jornada viajan como texto "YYYY-MM-DDTHH:mm" en hora de España, sin zona.
 * Es el mismo formato que usa <input type="datetime-local">, así que no hay conversiones:
 * lo que escribe el admin es lo que se guarda y lo que ven los usuarios.
 */

const aDate = (fecha: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(fecha ?? '');
  if (!m) return null;
  const [, y, mes, d, h, min] = m.map(Number);
  return new Date(y, mes - 1, d, h, min);
};

const dos = (n: number) => String(n).padStart(2, '0');

const aTexto = (d: Date): string =>
  `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`;

/** Suma días respetando la hora (p. ej. para proponer la jornada siguiente, +7). */
export function sumarDias(fecha: string, dias: number): string {
  const d = aDate(fecha);
  if (!d) return '';
  d.setDate(d.getDate() + dias);
  return aTexto(d);
}

const FORMATO_DIA = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

const FORMATO_DIA_LARGO = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** { dia: "sábado, 25 oct 2026", hora: "00:00" } para mostrar una fecha en dos líneas. */
export function partesFechaJornada(fecha: string): { dia: string; hora: string } | null {
  const d = aDate(fecha);
  if (!d) return null;
  return { dia: FORMATO_DIA_LARGO.format(d), hora: `${dos(d.getHours())}:${dos(d.getMinutes())}` };
}

/** "sáb, 25 oct · 00:00" */
export function formatearFechaJornada(fecha: string): string {
  const d = aDate(fecha);
  if (!d) return '—';
  return `${FORMATO_DIA.format(d)} · ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/**
 * Instalar la app en la pantalla de inicio (modal "Instalar la app" del perfil).
 *
 * Chrome/Edge en Android (y escritorio) lanzan "beforeinstallprompt" al cargar la web si se puede
 * instalar. Lo guardamos para ofrecer un botón de "Instalar" de un toque; si no llega (iPhone,
 * Firefox, ya instalada...), el modal enseña los pasos a mano.
 * escucharInstalacion() se llama una vez al arrancar (main.ts), antes de que llegue el evento.
 */

interface EventoInstalacion extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let eventoGuardado: EventoInstalacion | null = null;

export function escucharInstalacion() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // sin el mini-aviso de Chrome: la ofrecemos nosotros
    eventoGuardado = e as EventoInstalacion;
  });
  window.addEventListener('appinstalled', () => {
    eventoGuardado = null;
  });
}

/** El navegador permite instalar con un toque */
export function puedeInstalarDirecto(): boolean {
  return eventoGuardado !== null;
}

/** Abre el aviso de instalación del navegador. true si el usuario la ha instalado. */
export async function instalarDirecto(): Promise<boolean> {
  const evento = eventoGuardado;
  if (!evento) return false;
  await evento.prompt();
  const { outcome } = await evento.userChoice;
  eventoGuardado = null; // solo se puede usar una vez
  return outcome === 'accepted';
}

/** Ya se está usando como app instalada (abierta desde el icono) */
export function estaInstalada(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export type Dispositivo = 'ios' | 'android';

/** iPhone/iPad (también el iPad que se hace pasar por Mac) o, si no, Android */
export function detectarDispositivo(): Dispositivo {
  const ua = navigator.userAgent;
  const esIpad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || esIpad ? 'ios' : 'android';
}

import { environment } from '../../../environments/environment';

export type ResultadoCompartir = 'compartido' | 'copiado' | 'cancelado' | 'error';

/** Copia texto al portapapeles. Devuelve false si el navegador no lo permite. */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

/**
 * Abre el menú nativo de compartir (WhatsApp, Telegram...) con la invitación a la liga.
 * Si el navegador no lo soporta (la mayoría de escritorios), copia el código.
 */
export async function compartirLiga(nombreLiga: string, codigo: string): Promise<ResultadoCompartir> {
  const texto =
    `¡Únete a mi liga «${nombreLiga}» en Preferente Fantasy! ⚽\n` +
    `Código de acceso: ${codigo}\n` +
    `Entra en la app y pulsa «Unirse» → «Con código».`;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Preferente Fantasy', text: texto, url: environment.siteUrl });
      return 'compartido';
    } catch (error) {
      // El usuario cerró el menú de compartir: no es un error
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelado';
    }
  }

  return (await copiarTexto(codigo)) ? 'copiado' : 'error';
}

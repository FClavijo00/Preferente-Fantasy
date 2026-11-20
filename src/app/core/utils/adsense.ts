const ADSENSE_SRC =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8289024792996841';

/**
 * Carga el script de AdSense SOLO en las páginas con contenido propio (landing, jornada pública).
 * No va en index.html: así Google nunca encuentra su código en el login, el registro, la pantalla
 * de carga o las pantallas de la app ("anuncios en pantallas sin contenido del editor").
 * La verificación del sitio la hace la meta "google-adsense-account" de index.html.
 */
export function cargarAdsense(): void {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`script[src="${ADSENSE_SRC}"]`)) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = ADSENSE_SRC;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

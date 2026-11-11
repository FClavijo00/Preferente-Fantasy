import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { environment } from '../../../environments/environment';

const SITE_NAME = 'Preferente Fantasy';
const DEFAULT_DESCRIPTION =
  'Fantasy gratuito del fútbol provincial de Jaén. Crea tu plantilla con jugadores de la 1ª Andaluza, ' +
  'alinea tu 11 ideal cada jornada y compite en ligas públicas o privadas con tus amigos.';

/**
 * Datos SEO que puede declarar cada ruta en `data`:
 *  - description: meta description de la página.
 *  - noindex: true para que los buscadores no la indexen (zonas privadas).
 * Los datos de las rutas padre se heredan (p. ej. noindex en /tabs aplica a todas sus hijas).
 */
export interface SeoRouteData {
  description?: string;
  noindex?: boolean;
}

/**
 * Sustituye a la TitleStrategy por defecto de Angular: además del <title>,
 * mantiene sincronizados meta description, canonical, Open Graph y robots
 * en cada navegación.
 */
@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  private readonly _title = inject(Title);
  private readonly _meta = inject(Meta);
  private readonly _document = inject(DOCUMENT);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    const fullTitle = pageTitle ? `${pageTitle} | ${SITE_NAME}` : `${SITE_NAME} · Fantasy del fútbol provincial de Jaén`;
    const data = this.collectData(snapshot);
    const description = data.description ?? DEFAULT_DESCRIPTION;
    const url = environment.siteUrl + this.cleanPath(snapshot.url);

    this._title.setTitle(fullTitle);
    this._meta.updateTag({ name: 'description', content: description });
    this._meta.updateTag({ name: 'robots', content: data.noindex ? 'noindex, nofollow' : 'index, follow' });
    this._meta.updateTag({ property: 'og:title', content: fullTitle });
    this._meta.updateTag({ property: 'og:description', content: description });
    this._meta.updateTag({ property: 'og:url', content: url });
    this._meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this._meta.updateTag({ name: 'twitter:description', content: description });
    this.setCanonical(url);
  }

  /** Fusiona el `data` de toda la cadena de rutas activas (de raíz a hoja). */
  private collectData(snapshot: RouterStateSnapshot): SeoRouteData {
    let route: RouterStateSnapshot['root'] | null = snapshot.root;
    const merged: SeoRouteData = {};
    while (route) {
      Object.assign(merged, route.data);
      route = route.firstChild;
    }
    return merged;
  }

  /** Quita query params y fragmentos para que la canonical sea estable. */
  private cleanPath(url: string): string {
    return url.split(/[?#]/)[0];
  }

  private setCanonical(url: string): void {
    let link = this._document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this._document.createElement('link');
      link.rel = 'canonical';
      this._document.head.appendChild(link);
    }
    link.href = url;
  }
}

import { Component, input, signal } from '@angular/core';

/**
 * Foto del jugador con el aro del color de su posición y el escudo de su equipo
 * superpuesto abajo a la derecha. Se usa en el detalle del jugador y en el ranking.
 *
 *   <app-avatar-jugador [foto]="j.foto" [escudo]="j.escudo" posicion="DEF" [tamano]="48" />
 */
@Component({
  selector: 'app-avatar-jugador',
  template: `
    <span
      [class]="'avatar ' + (posicion()?.toLowerCase() ?? '')"
      [style.--tamano.px]="tamano()"
      aria-hidden="true"
    >
      <img
        class="foto"
        [src]="fotoFallida() || !foto() ? 'assets/images/default-player.png' : foto()"
        alt=""
        loading="lazy"
        (error)="fotoFallida.set(true)"
      />
      @if (escudo()) {
      <img class="escudo" [src]="escudo()" alt="" loading="lazy" />
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
    }

    .avatar {
      --tamano: 48px;
      position: relative;
      display: inline-block;
      width: var(--tamano);
      height: var(--tamano);
    }

    .foto {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      background: rgba(255, 255, 255, 0.06);
      border: 2px solid rgba(255, 255, 255, 0.15);
      box-sizing: border-box;
    }

    .por .foto { border-color: var(--pf-pos-por); }
    .def .foto { border-color: var(--pf-pos-def); }
    .med .foto { border-color: var(--pf-pos-med); }
    .del .foto { border-color: var(--pf-pos-del); }

    /* Escudo abajo a la derecha, como imagen normal (sin círculo) */
    .escudo {
      position: absolute;
      right: -6px;
      bottom: -4px;
      width: calc(var(--tamano) * 0.46);
      height: calc(var(--tamano) * 0.46);
      object-fit: contain;
      /* Sin círculo: el escudo tal cual, con sombra para despegarlo de la foto */
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.8));
    }
  `,
})
export class AvatarJugadorComponent {
  readonly foto = input<string | null | undefined>(null);
  readonly escudo = input<string | null | undefined>(null);
  readonly posicion = input<string | null | undefined>(null);
  /** Diámetro de la foto en px */
  readonly tamano = input(48);

  readonly fotoFallida = signal(false);
}

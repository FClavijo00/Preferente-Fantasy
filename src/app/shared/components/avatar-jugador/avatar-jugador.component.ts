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

    /* Escudo abajo a la derecha, con un aro del color del fondo para despegarlo de la foto */
    .escudo {
      position: absolute;
      right: -3px;
      bottom: -3px;
      width: calc(var(--tamano) * 0.42);
      height: calc(var(--tamano) * 0.42);
      padding: 2px;
      border-radius: 50%;
      object-fit: contain;
      background: var(--ion-color-stadium);
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
      box-sizing: border-box;
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

import type { ModalController } from '@ionic/angular/modal-controller';

type OpcionesModal = Parameters<ModalController['create']>[0];

/**
 * Opciones para abrir un modal que se ajusta a su contenido:
 * sheet desde abajo en el móvil y tarjeta centrada en el escritorio.
 * Los estilos están en src/theme/modal-auto.scss. El componente no debe usar ion-content.
 */
export function opcionesModalAuto(): Partial<OpcionesModal> {
  const esEscritorio = window.matchMedia('(min-width: 768px)').matches;
  return {
    mode: 'ios',
    cssClass: esEscritorio ? 'pf-dialogo' : 'pf-sheet',
    ...(esEscritorio ? {} : { initialBreakpoint: 1, breakpoints: [0, 1] }),
  };
}

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

/**
 * Opciones para un modal grande (campo de fútbol, actas del panel, editar perfil o liga):
 * sheet que ocupa casi toda la pantalla pero deja ver arriba los bordes redondeados y el tirador
 * (antes ocupaban el 100% y se perdían bajo la barra de estado). En el escritorio, centrado y
 * con ancho limitado. Estilos: .pf-sheet-alto en src/theme/modal-auto.scss.
 * El componente puede usar ion-header / ion-content (no se ajusta al contenido).
 */
export function opcionesModalAlto(): Partial<OpcionesModal> {
  return {
    mode: 'md',
    cssClass: 'pf-sheet-alto',
    initialBreakpoint: 1,
    breakpoints: [0, 1],
    handle: true,
  };
}

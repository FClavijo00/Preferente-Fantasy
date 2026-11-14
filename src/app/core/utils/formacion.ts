export type RolFormacion = 'POR' | 'DEF' | 'MED' | 'DEL';

/** Orden de las líneas en el campo (de arriba abajo) y de los huecos (hueco_index) */
export const LINEAS: RolFormacion[] = ['DEL', 'MED', 'DEF', 'POR'];

/**
 * Rol de cada hueco de una formación "DEF-MED-DEL" (p. ej. "4-4-2"): delanteros, medios,
 * defensas y, el último, el portero. Es el mismo orden que valida y guarda el backend.
 */
export function rolesFormacion(formacion: string): RolFormacion[] {
  const [def, med, del] = formacion.split('-').map(Number);
  return [
    ...Array<RolFormacion>(del).fill('DEL'),
    ...Array<RolFormacion>(med).fill('MED'),
    ...Array<RolFormacion>(def).fill('DEF'),
    'POR',
  ];
}

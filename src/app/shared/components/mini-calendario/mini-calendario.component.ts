import { Component, Input, OnInit, signal } from '@angular/core';

interface PartidoMini {
  partido_id: number;
  local_nombre: string;
  local_escudo: string;
  visitante_nombre: string;
  visitante_escudo: string;
}

@Component({
  selector: 'app-mini-calendario',
  templateUrl: './mini-calendario.component.html',
  styleUrls: ['./mini-calendario.component.scss'],
  imports: [],
})
export class MiniCalendarioComponent {

  @Input({ required: true }) miniCalendario: PartidoMini[] = [];
  @Input() jornada: any;

  constructor() { }

}

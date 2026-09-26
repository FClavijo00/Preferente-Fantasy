import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-detalle-jugador',
  templateUrl: './detalle-jugador.component.html',
  styleUrls: ['./detalle-jugador.component.scss'],
  imports: [],
})
export class DetalleJugadorComponent  implements OnInit {

  @Input() jugador: any;

  constructor() { }

  ngOnInit() {
    console.log(this.jugador);
  }

}

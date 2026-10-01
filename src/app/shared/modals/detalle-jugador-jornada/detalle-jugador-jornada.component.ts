import { Component, Input, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { medkit, checkmarkCircle } from 'ionicons/icons';
import { IonAvatar, IonCard, IonCardContent } from "@ionic/angular";

@Component({
  selector: 'app-detalle-jugador-jornada',
  templateUrl: './detalle-jugador-jornada.component.html',
  styleUrls: ['./detalle-jugador-jornada.component.scss'],
  imports: [IonCard, IonAvatar, IonCardContent ],
})
export class DetalleJugadorJornadaComponent implements OnInit {

  @Input() jugador: any;
  @Input() jornada: any;

  constructor() {
    addIcons({
      medkit,
      checkmarkCircle
    })
  }

  // Convierte el objeto JSON de desglose en una lista simple para el template
  getDesgloseArray(desglose: any): Array<{ concepto: string; puntos: number }> {
    if (!desglose) return [];

    const items: Array<{ concepto: string; puntos: number }> = [];

    // 1. Array de tarjetas (amarilla, roja)
    if (Array.isArray(desglose.tarjetas)) {
      desglose.tarjetas.forEach((t: any) => {
        if (t.puntos !== 0) items.push({ concepto: t.concepto, puntos: t.puntos });
      });
    }

    // 2. Array de goles
    if (Array.isArray(desglose.goles)) {
      desglose.goles.forEach((g: any) => {
        if (g.puntos !== 0) items.push({ concepto: g.concepto, puntos: g.puntos });
      });
    }

    // 3. Array de bonus de equipo (ej. Portería a cero)
    if (Array.isArray(desglose.bonusEquipo)) {
      desglose.bonusEquipo.forEach((b: any) => {
        if (b.puntos !== 0) items.push({ concepto: b.concepto, puntos: b.puntos });
      });
    }

    // 4. Objetos individuales: participacion, resultado, destacado
    const objetosClave = ['participacion', 'resultado', 'destacado'];
    objetosClave.forEach((key) => {
      const item = desglose[key];
      if (item && item.concepto && item.puntos !== undefined) {
        // Opcional: Si quieres ocultar conceptos de 0 puntos (como "Partido Perdido"), filtra aquí.
        // Si prefieres mostrarlos, quita la condición `item.puntos !== 0`.
        items.push({ concepto: item.concepto, puntos: item.puntos });
      }
    });

    return items;
  }


  ngOnInit() {
    console.log(this.jugador);
    console.log(this.jornada);
  }

}

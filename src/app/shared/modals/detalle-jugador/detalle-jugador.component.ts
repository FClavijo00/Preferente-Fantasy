import { Component, Input, OnInit, signal } from '@angular/core';
import {
  IonContent,
  IonAvatar,
  IonCardContent,
  IonCard,
  IonBadge,
  IonIcon,
} from '@ionic/angular';
import { DecimalPipe } from '@angular/common';
import { checkmarkCircle, medkit } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-detalle-jugador',
  templateUrl: './detalle-jugador.component.html',
  styleUrls: ['./detalle-jugador.component.scss'],
  imports: [
    IonIcon,
    IonCard,
    IonCardContent,
    IonAvatar,
    IonContent,
    DecimalPipe,
  ],
})
export class DetalleJugadorComponent implements OnInit {
  @Input() jugador: any;

  public media = signal<number>(0);

  // Signal para controlar qué jornada se muestra abajo
  jornadaSeleccionada = signal<any | null>(null);

  constructor() {
    addIcons({
      medkit,
      checkmarkCircle
    })
  }

  calcularMedia() {
    let media = 0;
    if (this.jugador.puntuaciones_jornada.length > 0) {
      this.jugador.puntuaciones_jornada.forEach((puntuacion: any) => {
        media += puntuacion.puntos;
      });
      media = media / this.jugador.puntuaciones_jornada.length;
    }
    return media || 0;
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

  seleccionarJornada(item: any) {
    this.jornadaSeleccionada.set(item);
  }

  ngOnInit() {
    if (this.jugador?.puntuaciones_jornada?.length > 0) {
      const ultimaJornada = this.jugador.puntuaciones_jornada[0];
      this.jornadaSeleccionada.set(ultimaJornada);
    }
    this.media.set(this.calcularMedia());
  }
}

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleJugadorJornadaComponent } from './detalle-jugador-jornada.component';

describe('DetalleJugadorJornadaComponent', () => {
  let component: DetalleJugadorJornadaComponent;
  let fixture: ComponentFixture<DetalleJugadorJornadaComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalleJugadorJornadaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

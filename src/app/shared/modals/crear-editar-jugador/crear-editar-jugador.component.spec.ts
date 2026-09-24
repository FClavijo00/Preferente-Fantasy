import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearEditarJugadorComponent } from './crear-editar-jugador.component';

describe('CrearEditarJugadorComponent', () => {
  let component: CrearEditarJugadorComponent;
  let fixture: ComponentFixture<CrearEditarJugadorComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CrearEditarJugadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearEditarPartidoComponent } from './crear-editar-partido.component';

describe('CrearEditarPartidoComponent', () => {
  let component: CrearEditarPartidoComponent;
  let fixture: ComponentFixture<CrearEditarPartidoComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CrearEditarPartidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectJugadoresComponent } from './select-jugadores.component';

describe('SelectJugadoresComponent', () => {
  let component: SelectJugadoresComponent;
  let fixture: ComponentFixture<SelectJugadoresComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectJugadoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

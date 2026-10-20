import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectJugadoresOnceIdealComponent } from './select-jugadores-once-ideal.component';

describe('SelectJugadoresOnceIdealComponent', () => {
  let component: SelectJugadoresOnceIdealComponent;
  let fixture: ComponentFixture<SelectJugadoresOnceIdealComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectJugadoresOnceIdealComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

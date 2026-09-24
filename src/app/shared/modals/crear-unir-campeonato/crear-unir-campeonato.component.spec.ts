import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearUnirCampeonatoComponent } from './crear-unir-campeonato.component';

describe('CrearUnirCampeonatoComponent', () => {
  let component: CrearUnirCampeonatoComponent;
  let fixture: ComponentFixture<CrearUnirCampeonatoComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CrearUnirCampeonatoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlantillaClasificacionComponent } from './plantilla-clasificacion.component';

describe('PlantillaClasificacionComponent', () => {
  let component: PlantillaClasificacionComponent;
  let fixture: ComponentFixture<PlantillaClasificacionComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PlantillaClasificacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlantillasPage } from './plantillas.page';

describe('PlantillasPage', () => {
  let component: PlantillasPage;
  let fixture: ComponentFixture<PlantillasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PlantillasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

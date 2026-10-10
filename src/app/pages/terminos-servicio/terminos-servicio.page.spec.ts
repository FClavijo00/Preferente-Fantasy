import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TerminosServicioPage } from './terminos-servicio.page';

describe('TerminosServicioPage', () => {
  let component: TerminosServicioPage;
  let fixture: ComponentFixture<TerminosServicioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TerminosServicioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

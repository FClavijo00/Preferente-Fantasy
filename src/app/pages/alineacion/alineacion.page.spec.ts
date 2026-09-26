import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlineacionPage } from './alineacion.page';

describe('AlineacionPage', () => {
  let component: AlineacionPage;
  let fixture: ComponentFixture<AlineacionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AlineacionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoPuntuacionComponent } from './info-puntuacion.component';

describe('InfoPuntuacionComponent', () => {
  let component: InfoPuntuacionComponent;
  let fixture: ComponentFixture<InfoPuntuacionComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoPuntuacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

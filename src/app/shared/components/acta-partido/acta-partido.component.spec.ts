import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActaPartidoComponent } from './acta-partido.component';

describe('ActaPartidoComponent', () => {
  let component: ActaPartidoComponent;
  let fixture: ComponentFixture<ActaPartidoComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ActaPartidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarLigaComponent } from './editar-liga.component';

describe('EditarLigaComponent', () => {
  let component: EditarLigaComponent;
  let fixture: ComponentFixture<EditarLigaComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditarLigaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

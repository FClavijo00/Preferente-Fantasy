import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnceIdealComponent } from './once-ideal.component';

describe('OnceIdealComponent', () => {
  let component: OnceIdealComponent;
  let fixture: ComponentFixture<OnceIdealComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OnceIdealComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

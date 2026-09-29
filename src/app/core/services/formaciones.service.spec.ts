import { TestBed } from '@angular/core/testing';

import { FormacionesService } from './formaciones.service';

describe('FormacionesService', () => {
  let service: FormacionesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormacionesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

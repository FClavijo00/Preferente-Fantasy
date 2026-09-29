import { TestBed } from '@angular/core/testing';

import { AlineacionesService } from './alineaciones.service';

describe('AlineacionesService', () => {
  let service: AlineacionesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlineacionesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

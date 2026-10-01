import { TestBed } from '@angular/core/testing';

import { ClasificacionesService } from './clasificaciones.service';

describe('ClasificacionesService', () => {
  let service: ClasificacionesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClasificacionesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

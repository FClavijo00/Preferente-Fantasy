import { TestBed } from '@angular/core/testing';

import { JornadasService } from './jornadas-service';

describe('JornadasService', () => {
  let service: JornadasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JornadasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { LiveClassesService } from './live-classes.service';

describe('LiveClassesService', () => {
  let service: LiveClassesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiveClassesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

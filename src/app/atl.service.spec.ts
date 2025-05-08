import { TestBed } from '@angular/core/testing';

import { AtlService } from './atl.service';

describe('AtlService', () => {
  let service: AtlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AtlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

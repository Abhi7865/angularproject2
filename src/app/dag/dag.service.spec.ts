import { TestBed } from '@angular/core/testing';

import { DagService } from './dag.service';

describe('DagService', () => {
  let service: DagService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DagService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { Node1Service } from './node1.service';

describe('Node1Service', () => {
  let service: Node1Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Node1Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

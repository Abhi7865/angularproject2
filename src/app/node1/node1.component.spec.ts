import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Node1Component } from './node1.component';

describe('Node1Component', () => {
  let component: Node1Component;
  let fixture: ComponentFixture<Node1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Node1Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Node1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

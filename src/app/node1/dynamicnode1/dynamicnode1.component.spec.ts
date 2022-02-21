import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dynamicnode1Component } from './dynamicnode1.component';

describe('Dynamicnode1Component', () => {
  let component: Dynamicnode1Component;
  let fixture: ComponentFixture<Dynamicnode1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Dynamicnode1Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Dynamicnode1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

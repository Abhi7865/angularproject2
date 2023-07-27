import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DagDialogComponent } from './dag-dialog.component';

describe('DagDialogComponent', () => {
  let component: DagDialogComponent;
  let fixture: ComponentFixture<DagDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DagDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DagDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

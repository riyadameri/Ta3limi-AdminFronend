import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoreComponent } from './dore.component';

describe('DoreComponent', () => {
  let component: DoreComponent;
  let fixture: ComponentFixture<DoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

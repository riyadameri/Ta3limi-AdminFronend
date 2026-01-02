import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassCommissionComponent } from './class-commission.component';

describe('ClassCommissionComponent', () => {
  let component: ClassCommissionComponent;
  let fixture: ComponentFixture<ClassCommissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassCommissionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassCommissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

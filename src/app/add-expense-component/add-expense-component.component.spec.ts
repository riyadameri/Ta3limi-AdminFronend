import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddExpenseComponentComponent } from './add-expense-component.component';

describe('AddExpenseComponentComponent', () => {
  let component: AddExpenseComponentComponent;
  let fixture: ComponentFixture<AddExpenseComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddExpenseComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddExpenseComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

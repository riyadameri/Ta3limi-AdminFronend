import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddStudentToClassesModalComponent } from './add-student-to-classes-modal.component';

describe('AddStudentToClassesModalComponent', () => {
  let component: AddStudentToClassesModalComponent;
  let fixture: ComponentFixture<AddStudentToClassesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddStudentToClassesModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddStudentToClassesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

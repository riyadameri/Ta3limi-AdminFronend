import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonManagementComponentComponent } from './lesson-management-component.component';

describe('LessonManagementComponentComponent', () => {
  let component: LessonManagementComponentComponent;
  let fixture: ComponentFixture<LessonManagementComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonManagementComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonManagementComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

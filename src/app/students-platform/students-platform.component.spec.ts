import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentsPlatformComponent } from './students-platform.component';

describe('StudentsPlatformComponent', () => {
  let component: StudentsPlatformComponent;
  let fixture: ComponentFixture<StudentsPlatformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentsPlatformComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentsPlatformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomsManagementComponentComponent } from './rooms-management-component.component';

describe('RoomsManagementComponentComponent', () => {
  let component: RoomsManagementComponentComponent;
  let fixture: ComponentFixture<RoomsManagementComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomsManagementComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomsManagementComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

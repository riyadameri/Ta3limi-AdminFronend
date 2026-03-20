import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesDashboardComponent } from './messages-dashboard.component';

describe('MessagesDashboardComponent', () => {
  let component: MessagesDashboardComponent;
  let fixture: ComponentFixture<MessagesDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessagesDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessagesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

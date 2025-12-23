import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveClassComponent } from './live-class.component';

describe('LiveClassComponent', () => {
  let component: LiveClassComponent;
  let fixture: ComponentFixture<LiveClassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveClassComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

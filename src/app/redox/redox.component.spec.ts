import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedoxComponent } from './redox.component';

describe('RedoxComponent', () => {
  let component: RedoxComponent;
  let fixture: ComponentFixture<RedoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RedoxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RedoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

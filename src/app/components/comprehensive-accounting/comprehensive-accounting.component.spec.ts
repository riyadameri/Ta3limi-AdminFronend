import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComprehensiveAccountingComponent } from './comprehensive-accounting.component';

describe('ComprehensiveAccountingComponent', () => {
  let component: ComprehensiveAccountingComponent;
  let fixture: ComponentFixture<ComprehensiveAccountingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprehensiveAccountingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComprehensiveAccountingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

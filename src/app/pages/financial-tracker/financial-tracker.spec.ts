import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialTracker } from './financial-tracker';

describe('FinancialTracker', () => {
  let component: FinancialTracker;
  let fixture: ComponentFixture<FinancialTracker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialTracker],
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialTracker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

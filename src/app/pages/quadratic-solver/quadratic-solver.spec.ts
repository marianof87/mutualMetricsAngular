import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuadraticSolver } from './quadratic-solver';

describe('QuadraticSolver', () => {
  let component: QuadraticSolver;
  let fixture: ComponentFixture<QuadraticSolver>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuadraticSolver],
    }).compileComponents();

    fixture = TestBed.createComponent(QuadraticSolver);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { FinancialTracker } from './pages/financial-tracker/financial-tracker';
import { QuadraticSolver } from './pages/quadratic-solver/quadratic-solver';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'financial-tracker', component: FinancialTracker },
  { path: 'quadratic-solver', component: QuadraticSolver },
  { path: '**', redirectTo: '' }
];

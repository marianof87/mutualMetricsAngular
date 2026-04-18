import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-financial-tracker',
  imports: [FormsModule, CommonModule],
  templateUrl: './financial-tracker.html',
  styleUrl: './financial-tracker.css'
})
export class FinancialTracker {
  // Inputs
  pricePerUnit = signal<number>(150);
  variableCostPerUnit = signal<number>(80);
  fixedCosts = signal<number>(50000);
  estimatedUnits = signal<number>(1000);
  taxRate = signal<number>(21);

  // Calcs
  revenue = computed(() => this.pricePerUnit() * this.estimatedUnits());
  totalVariableCosts = computed(() => this.variableCostPerUnit() * this.estimatedUnits());
  totalCosts = computed(() => this.fixedCosts() + this.totalVariableCosts());
  
  grossProfit = computed(() => this.revenue() - this.totalCosts());
  
  taxes = computed(() => {
    const profit = this.grossProfit();
    return profit > 0 ? profit * (this.taxRate() / 100) : 0;
  });

  netProfit = computed(() => this.grossProfit() - this.taxes());

  breakEvenPoint = computed(() => {
    const contributionMargin = this.pricePerUnit() - this.variableCostPerUnit();
    return contributionMargin > 0 ? this.fixedCosts() / contributionMargin : 0;
  });
}

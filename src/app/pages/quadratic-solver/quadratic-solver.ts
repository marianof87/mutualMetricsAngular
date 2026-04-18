import { Component, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-quadratic-solver',
  imports: [FormsModule, CommonModule, BaseChartDirective],
  templateUrl: './quadratic-solver.html',
  styleUrl: './quadratic-solver.css'
})
export class QuadraticSolver {
  a = signal<number>(1);
  b = signal<number>(-4);
  c = signal<number>(4);

  discriminant = computed(() => Math.pow(this.b(), 2) - 4 * this.a() * this.c());
  
  hasRealRoots = computed(() => this.discriminant() >= 0);
  
  roots = computed(() => {
    if (!this.hasRealRoots() || this.a() === 0) return null;
    const det = this.discriminant();
    const a = this.a();
    const b = this.b();
    if (det === 0) return { x1: -b / (2 * a), x2: null };
    return {
      x1: (-b + Math.sqrt(det)) / (2 * a),
      x2: (-b - Math.sqrt(det)) / (2 * a)
    };
  });

  vertex = computed(() => {
    if (this.a() === 0) return null;
    const vx = -this.b() / (2 * this.a());
    const vy = this.a() * Math.pow(vx, 2) + this.b() * vx + this.c();
    return { x: vx, y: vy };
  });

  lineChartData = signal<ChartConfiguration<'line'>['data']>({
    labels: [],
    datasets: []
  });

  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: { tension: 0.4 },
      point: { radius: 2 }
    },
    scales: {
      x: { title: { display: true, text: 'X', color: '#ffbe76' }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a0a5b8' } },
      y: { title: { display: true, text: 'f(X)', color: '#ffbe76' }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a0a5b8' } }
    },
    plugins: {
      legend: { labels: { color: '#f8f9fa' } }
    }
  };

  constructor() {
    effect(() => {
      this.updateChart();
    });
  }

  updateChart() {
    if (this.a() === 0) return;
    const vx = this.vertex()?.x ?? 0;
    const labels = [];
    const data = [];
    
    // Generate points around vertex
    for (let i = vx - 10; i <= vx + 10; i += 0.5) {
      labels.push(i.toFixed(1));
      data.push(this.a() * Math.pow(i, 2) + this.b() * i + this.c());
    }

    this.lineChartData.set({
      labels,
      datasets: [
        {
          data,
          label: `f(x) = ${this.a()}x² + ${this.b()}x + ${this.c()}`,
          fill: true,
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderColor: 'rgba(255, 107, 107, 1)',
          pointBackgroundColor: 'rgba(240, 147, 43, 1)'
        }
      ]
    });
  }
}

import { defineConfig } from 'vitest/config';

// Config de tests + coverage para el paquete shared.
//
// Threshold meta: 80% (branches, functions, lines, statements).
// Se activó con la entrega del módulo actuarial (cobertura medida: statements
// 95.76%, branches 85.98%, functions 100%, lines 96.59%). Si baja, el CI falla.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: { branches: 80, functions: 80, lines: 80, statements: 80 },
    },
  },
});

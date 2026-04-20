import { defineConfig } from 'vitest/config';

// Config de tests + coverage para el paquete shared.
//
// Threshold meta: 80% (branches, functions, lines, statements).
// Está comentado hasta que el paquete tenga TDD armado por sección; los
// stubs iniciales no alcanzan a cubrirlo. Re-activar al implementar.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts'],
      reporter: ['text', 'html', 'lcov'],
      // thresholds: { branches: 80, functions: 80, lines: 80, statements: 80 },
    },
  },
});

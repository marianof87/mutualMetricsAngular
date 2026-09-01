import { describe, it, expect, vi, afterEach } from 'vitest';

describe('entorno', () => {
  // Guardar valor original para restaurar entre tests y no contaminar otros specs
  const originalConfig = (globalThis as unknown as { window?: Window }).window
    ? (window as unknown as { __MUTUAL_METRICS_CONFIG__?: { apiBaseUrl?: string } }).__MUTUAL_METRICS_CONFIG__
    : undefined;

  afterEach(() => {
    if (originalConfig === undefined) {
      delete (window as unknown as { __MUTUAL_METRICS_CONFIG__?: unknown }).__MUTUAL_METRICS_CONFIG__;
    } else {
      (window as unknown as { __MUTUAL_METRICS_CONFIG__?: unknown }).__MUTUAL_METRICS_CONFIG__ = originalConfig;
    }
    vi.resetModules();
  });

  it('usa /api/v1 por defecto cuando window.__MUTUAL_METRICS_CONFIG__ no esta definido', async () => {
    delete (window as unknown as { __MUTUAL_METRICS_CONFIG__?: unknown }).__MUTUAL_METRICS_CONFIG__;
    vi.resetModules();
    const { entorno } = await import('./entorno');
    expect(entorno.apiBaseUrl).toBe('/api/v1');
  });

  it('usa /api/v1 cuando apiBaseUrl es undefined dentro del objeto global', async () => {
    (window as unknown as { __MUTUAL_METRICS_CONFIG__?: unknown }).__MUTUAL_METRICS_CONFIG__ = {};
    vi.resetModules();
    const { entorno } = await import('./entorno');
    expect(entorno.apiBaseUrl).toBe('/api/v1');
  });

  it('usa /api/v1 cuando apiBaseUrl es string vacio (falsy)', async () => {
    (window as unknown as { __MUTUAL_METRICS_CONFIG__?: unknown }).__MUTUAL_METRICS_CONFIG__ = { apiBaseUrl: '' };
    vi.resetModules();
    const { entorno } = await import('./entorno');
    expect(entorno.apiBaseUrl).toBe('/api/v1');
  });

  it('respeta el override cuando window.__MUTUAL_METRICS_CONFIG__.apiBaseUrl esta definido', async () => {
    (window as unknown as { __MUTUAL_METRICS_CONFIG__?: unknown }).__MUTUAL_METRICS_CONFIG__ = {
      apiBaseUrl: 'https://api.example.com/v2',
    };
    vi.resetModules();
    const { entorno } = await import('./entorno');
    expect(entorno.apiBaseUrl).toBe('https://api.example.com/v2');
  });

  it('respeta override con URL relativa custom', async () => {
    (window as unknown as { __MUTUAL_METRICS_CONFIG__?: unknown }).__MUTUAL_METRICS_CONFIG__ = {
      apiBaseUrl: '/custom/api',
    };
    vi.resetModules();
    const { entorno } = await import('./entorno');
    expect(entorno.apiBaseUrl).toBe('/custom/api');
  });
});

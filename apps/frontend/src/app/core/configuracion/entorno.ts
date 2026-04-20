/**
 * Configuración de entorno del frontend.
 *
 * `API_BASE_URL` se lee (opcionalmente) de una global inyectada por el HTML
 * (útil cuando el build se sirve detrás de un reverse proxy). Si no hay
 * global, caemos al default de desarrollo.
 */

declare global {
  interface Window {
    __MUTUAL_METRICS_CONFIG__?: { apiBaseUrl?: string };
  }
}

const defaultDev = 'http://localhost:3000/api/v1';

export const entorno = {
  apiBaseUrl:
    (typeof window !== 'undefined' && window.__MUTUAL_METRICS_CONFIG__?.apiBaseUrl) || defaultDev,
};

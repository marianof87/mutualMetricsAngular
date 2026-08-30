/**
 * Configuración de entorno del frontend.
 *
 * `API_BASE_URL` se lee (opcionalmente) de una global inyectada por el HTML
 * (útil cuando el build se sirve detrás de un reverse proxy). Si no hay
 * global, usamos una ruta relativa mismo-origen: en desarrollo la resuelve el
 * proxy de `ng serve` y en producción el proxy `/api/` de nginx.
 */

declare global {
  interface Window {
    __MUTUAL_METRICS_CONFIG__?: { apiBaseUrl?: string };
  }
}

// Ruta relativa mismo-origen: el proxy (dev o nginx) reenvía /api -> backend.
const apiRutaRelativa = '/api/v1';

export const entorno = {
  apiBaseUrl:
    (typeof window !== 'undefined' && window.__MUTUAL_METRICS_CONFIG__?.apiBaseUrl) || apiRutaRelativa,
};

/**
 * Catálogo único de códigos de error del proyecto.
 *
 * Regla: los códigos son estables y compartidos. Si agregás uno,
 * documentalo en docs/CODIGOS_ERROR.md en el mismo PR.
 */
export const CodigoError = {
  // Generales (todos los slices pueden usarlos)
  ENTRADA_INVALIDA: 'ENTRADA_INVALIDA',
  RECURSO_NO_ENCONTRADO: 'RECURSO_NO_ENCONTRADO',
  NO_AUTORIZADO: 'NO_AUTORIZADO',
  PROHIBIDO: 'PROHIBIDO',
  CONFLICTO: 'CONFLICTO',
  LIMITE_EXCEDIDO: 'LIMITE_EXCEDIDO',
  ERROR_INTERNO: 'ERROR_INTERNO',
  SERVICIO_NO_DISPONIBLE: 'SERVICIO_NO_DISPONIBLE',

  // Slice 1 — Auth & Usuarios (@Nubiru)
  AUTH_CREDENCIALES_INVALIDAS: 'AUTH_CREDENCIALES_INVALIDAS',
  AUTH_EMAIL_YA_REGISTRADO: 'AUTH_EMAIL_YA_REGISTRADO',
  AUTH_TOKEN_EXPIRADO: 'AUTH_TOKEN_EXPIRADO',
  AUTH_TOKEN_INVALIDO: 'AUTH_TOKEN_INVALIDO',

  // Slice 2 — Cuadrática (@marianof87)
  CUADRATICA_A_CERO: 'CUADRATICA_A_CERO',
  SIMULACION_SIN_INCERTIDUMBRE: 'SIMULACION_SIN_INCERTIDUMBRE',

  // Slice 3 — Pricing (@Monzon1983)
  PRICING_SENSIBILIDAD_CERO: 'PRICING_SENSIBILIDAD_CERO',
  PRICING_OPTIMO_FUERA_DE_RANGO: 'PRICING_OPTIMO_FUERA_DE_RANGO',

  // Slice 4 — Escenarios (@Franco1212)
  // (agregar acá según se necesiten)

  // Slice 5 — Contacto & Novedades (@Ange1809)
  CONTACTO_EMAIL_INVALIDO: 'CONTACTO_EMAIL_INVALIDO',
  CONTACTO_MENSAJE_VACIO: 'CONTACTO_MENSAJE_VACIO',

  // Lead Magnet — captación de leads (gated content)
  LEAD_EMAIL_INVALIDO: 'LEAD_EMAIL_INVALIDO',
  LEAD_WHATSAPP_INVALIDO: 'LEAD_WHATSAPP_INVALIDO',
} as const;

export type CodigoError = (typeof CodigoError)[keyof typeof CodigoError];

// Códigos que significan "la sesión/token ya no es válido": usados por el
// interceptor de errores y por el servicio de sesión (fuente única de verdad).
export const CODIGOS_TOKEN_RECHAZADO: readonly string[] = [
  CodigoError.AUTH_TOKEN_EXPIRADO,
  CodigoError.AUTH_TOKEN_INVALIDO,
] as const;

export type CodigoTokenRechazado = (typeof CODIGOS_TOKEN_RECHAZADO)[number];

/**
 * Catálogo único de códigos de error del proyecto.
 *
 * Regla: los códigos son estables y compartidos. Si agregás uno,
 * documentalo en docs/CODIGOS_ERROR.md en el mismo PR.
 */
export const CodigoError = {
  // Generales (todas las secciones pueden usarlos)
  ENTRADA_INVALIDA: 'ENTRADA_INVALIDA',
  RECURSO_NO_ENCONTRADO: 'RECURSO_NO_ENCONTRADO',
  NO_AUTORIZADO: 'NO_AUTORIZADO',
  PROHIBIDO: 'PROHIBIDO',
  CONFLICTO: 'CONFLICTO',
  LIMITE_EXCEDIDO: 'LIMITE_EXCEDIDO',
  ERROR_INTERNO: 'ERROR_INTERNO',
  SERVICIO_NO_DISPONIBLE: 'SERVICIO_NO_DISPONIBLE',

  // Específicos de Contacto
  CONTACTO_EMAIL_INVALIDO: 'CONTACTO_EMAIL_INVALIDO',
  CONTACTO_MENSAJE_VACIO: 'CONTACTO_MENSAJE_VACIO',

  // Placeholders para las demás secciones (cada dueño los completa)
  // INICIO_*
  // SOBRE_NOSOTROS_*
  // SERVICIOS_*
  // NOVEDADES_*
} as const;

export type CodigoError = (typeof CodigoError)[keyof typeof CodigoError];

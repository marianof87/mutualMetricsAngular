import { z } from 'zod';
import { ParametrosPaginacionSchema } from './paginacion';

// Tipos de cálculo que puede guardar un escenario (enum cerrado).
// Se puede extender con una migración futura si aparecen nuevos tipos.
export const TipoEscenarioSchema = z.enum(['cuadratica', 'pricing']);

export type TipoEscenario = z.infer<typeof TipoEscenarioSchema>;

// Payload de creación: tipo + inputs/outputs serializables a JSON.
// Los campos inputs/outputs son libres (cualquier cálculo); su estructura
// interna se valida al momento de re-ejecutar el escenario en el frontend.
export const EscenarioCreateSchema = z.object({
  tipo: TipoEscenarioSchema,
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
});

export type EscenarioCreateRequest = z.infer<typeof EscenarioCreateSchema>;

// Respuesta del backend: datos del escenario + metadatos.
// No expone usuarioId: el frontend solo ve los escenarios del usuario
// autenticado (el id del dueño queda en el modelo de datos interno).
export const EscenarioSchema = EscenarioCreateSchema.extend({
  id: z.string().uuid(),
  creadoEn: z.string().datetime(),
});

export type EscenarioResponse = z.infer<typeof EscenarioSchema>;

// Parámetros del listado de escenarios: paginación estándar + filtro opcional
// por tipo de cálculo. Extiende la paginación global SIN contaminarla: el filtro
// `tipo` es específico de escenarios y queda acotado a este listado.
export const ParametrosListadoEscenariosSchema = ParametrosPaginacionSchema.extend({
  tipo: TipoEscenarioSchema.optional(),
});

export type ParametrosListadoEscenarios = z.infer<typeof ParametrosListadoEscenariosSchema>;

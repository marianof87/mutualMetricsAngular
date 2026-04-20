import { z } from 'zod';

// Parámetros estándar de paginación.
// Convención del proyecto: todo listado usa `?page=1&tamano=20`.
// La respuesta sigue el tipo `Paginado<T>`.
export const ParametrosPaginacionSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  tamano: z.coerce.number().int().positive().max(100).default(20),
});

export type ParametrosPaginacion = z.infer<typeof ParametrosPaginacionSchema>;

// Respuesta paginada genérica. Usar `Paginado<MiTipo>` en el tipo de retorno.
export interface Paginado<T> {
  datos: T[];
  total: number;
  pagina: number;
  tamano: number;
}

// Helper para construir el schema Zod de un `Paginado<T>` concreto.
// Ejemplo:
//   export const NovedadesPaginadasSchema = paginadoSchema(NovedadSchema);
export function paginadoSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    datos: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    pagina: z.number().int().positive(),
    tamano: z.number().int().positive(),
  });
}

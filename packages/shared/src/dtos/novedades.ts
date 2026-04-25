import { z } from 'zod';
import { ParametrosPaginacionSchema } from './paginacion'; // Asumo que existe según GUIA.md

// Schema para crear una novedad
export const CrearNovedadSchema = z.object({
  titulo: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100),
  contenido: z.string().min(10, 'El contenido es muy corto'),
  imagenUrl: z.string().url('Debe ser una URL válida').optional(),
});

// Schema de respuesta (lo que devuelve el backend)
export const NovedadResponseSchema = CrearNovedadSchema.extend({
  id: z.string().uuid(),
  fechaCreacion: z.string().datetime(),
});

// Tipos inferidos para usar en Angular y NestJS
export type CrearNovedadRequest = z.infer<typeof CrearNovedadSchema>;
export type NovedadResponse = z.infer<typeof NovedadResponseSchema>;
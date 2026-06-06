import { z } from 'zod';

// Esquema de validación para los datos de entrada del optimizador (Request)
export const OptimizarPrecioRequestSchema = z.object({
  coeficienteA: z.number({ required_error: "El coeficiente A es requerido" }),
  coeficienteB: z.number({ required_error: "El coeficiente B es requerido" }),
  coeficienteC: z.number({ required_error: "El coeficiente C es requerido" }),
  precioMinimo: z.number().min(0, "El precio mínimo no puede ser negativo"),
  precioMaximo: z.number().positive("El precio máximo debe ser mayor a 0"),
});

// Tipos estáticos inferidos a partir de los esquemas de Zod
export type OptimizarPrecioRequest = z.infer<typeof OptimizarPrecioRequestSchema>;

// Esquema para la respuesta del optimizador (Response)
export const OptimizarPrecioResponseSchema = z.object({
  precioOptimo: z.number(),
  gananciaMaxima: z.number(),
  estrategiaSugerida: z.string(),
});

export type OptimizarPrecioResponse = z.infer<typeof OptimizarPrecioResponseSchema>;
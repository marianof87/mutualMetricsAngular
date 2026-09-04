import { z } from 'zod';

export const CuadraticaRequestSchema = z.object({
  a: z.number(),
  b: z.number(),
  c: z.number(),
});

export type CuadraticaRequest = z.infer<typeof CuadraticaRequestSchema>;

export const CuadraticaResponseSchema = z.object({
  discriminante: z.number(),
  tipo: z.enum(['dosReales', 'unaRealDoble', 'sinRaicesReales']),
  raices: z.array(z.number()).length(2).nullable(),
  vertice: z.object({ x: z.number(), y: z.number() }),
});

export type CuadraticaResponse = z.infer<typeof CuadraticaResponseSchema>;
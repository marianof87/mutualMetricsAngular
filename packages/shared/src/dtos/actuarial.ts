import { z } from 'zod';

// Parámetro estocástico: modela un coeficiente de la parábola que el dueño
// declara con incertidumbre (rango triangular o normal con nivel de confianza)
// en lugar de un número fijo.

export const ParametroFijoSchema = z.object({
  tipo: z.literal('fijo'),
  valor: z.number(),
});

export const ParametroTriangularSchema = z.object({
  tipo: z.literal('triangular'),
  minimo: z.number(),
  moda: z.number(),
  maximo: z.number(),
});

export const ParametroNormalSchema = z.object({
  tipo: z.literal('normal'),
  minimo: z.number(),
  maximo: z.number(),
  // Ej: "los costos pueden variar entre 800 y 1200 con un 90% de probabilidad"
  nivelConfianza: z
    .number()
    .min(0.51, 'El nivel de confianza debe ser mayor a 0.5')
    .max(0.999, 'El nivel de confianza debe ser menor a 1')
    .default(0.9),
});

export const ParametroEstocasticoSchema = z
  .discriminatedUnion('tipo', [
    ParametroFijoSchema,
    ParametroTriangularSchema,
    ParametroNormalSchema,
  ])
  .superRefine((parametro, contexto) => {
    if (parametro.tipo === 'fijo') return;
    if (parametro.minimo >= parametro.maximo) {
      contexto.addIssue({
        code: 'custom',
        message: 'El mínimo debe ser menor que el máximo',
        path: ['minimo'],
      });
    }
    if (parametro.tipo === 'triangular' && (parametro.moda < parametro.minimo || parametro.moda > parametro.maximo)) {
      contexto.addIssue({
        code: 'custom',
        message: 'El parámetro triangular debe cumplir minimo <= moda <= maximo',
        path: ['moda'],
      });
    }
  });

export type ParametroEstocastico = z.infer<typeof ParametroEstocasticoSchema>;

// Solicitud de simulación actuarial (Monte Carlo) sobre la parábola de ganancia
// G(P) = A·P² + B·P + C. Solo A y C pueden ser estocásticos en v1.
export const SimulacionActuarialRequestSchema = z.object({
  coeficienteA: ParametroEstocasticoSchema,
  coeficienteB: z.number(),
  coeficienteC: ParametroEstocasticoSchema,
  precioMinimo: z.number().min(0, 'El precio mínimo no puede ser negativo'),
  precioMaximo: z.number().positive('El precio máximo debe ser mayor a 0'),
  precioActual: z.number().min(0, 'El precio actual no puede ser negativo').optional(),
  nSimulaciones: z
    .number()
    .int()
    .min(100, 'El mínimo de simulaciones es 100')
    .max(100000, 'El máximo de simulaciones es 100.000')
    .default(10000),
  nivelConfianza: z
    .number()
    .min(0.8, 'El nivel de confianza debe ser al menos 0.8')
    .max(0.99, 'El nivel de confianza debe ser como máximo 0.99')
    .default(0.95),
  semilla: z.number().int().min(1, 'La semilla debe ser un entero positivo').optional(),
});

export type SimulacionActuarialRequest = z.infer<typeof SimulacionActuarialRequestSchema>;

const DistribucionResumenSchema = z.object({
  media: z.number(),
  mediana: z.number(),
  desvio: z.number(),
  percentiles: z.record(z.string(), z.number()),
  intervalo: z.object({
    minimo: z.number(),
    maximo: z.number(),
  }),
});

export type DistribucionResumen = z.infer<typeof DistribucionResumenSchema>;

// Respuesta: intervalos con probabilidad antes que números falsos con dos
// decimales (OBJ-2: honestidad antes que precisión).
export const SimulacionActuarialResponseSchema = z.object({
  nSimulaciones: z.number(),
  semilla: z.number(),
  muestrasInvalidas: z.number(),
  nivelConfianza: z.number(),
  precioOptimo: DistribucionResumenSchema,
  gananciaMaxima: DistribucionResumenSchema,
  puntoEquilibrio: DistribucionResumenSchema,
  pisoSolvencia: z.number().nullable(),
  probabilidadPerdida: z.object({
    enPrecioOptimo: z.number(),
    enPrecioActual: z.number().nullish(),
  }),
  curvaRiesgo: z.array(
    z.object({
      precio: z.number(),
      probabilidadPerdida: z.number(),
    }),
  ),
  advertencias: z.array(z.string()),
});

export type SimulacionActuarialResponse = z.infer<typeof SimulacionActuarialResponseSchema>;
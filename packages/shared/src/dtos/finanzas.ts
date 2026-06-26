import { z } from 'zod';

// --- Interés Simple ---
export const InteresSimpleRequestSchema = z.object({
  principal: z.number().min(0, "El capital debe ser positivo"),
  tasa: z.number().min(0, "La tasa debe ser positiva"),
  tiempo: z.number().min(0, "El tiempo debe ser positivo")
});

export type InteresSimpleRequest = z.infer<typeof InteresSimpleRequestSchema>;

export const InteresSimpleResponseSchema = z.object({
  interes: z.number(),
  total: z.number()
});

export type InteresSimpleResponse = z.infer<typeof InteresSimpleResponseSchema>;

// --- Interés Compuesto ---
export const InteresCompuestoRequestSchema = z.object({
  principal: z.number().min(0),
  tasa: z.number().min(0),
  tiempo: z.number().min(0),
  frecuencia: z.number().min(1, "La frecuencia mínima es 1 (anual)").optional().default(1)
});

export type InteresCompuestoRequest = z.infer<typeof InteresCompuestoRequestSchema>;

export const InteresCompuestoResponseSchema = z.object({
  interes: z.number(),
  total: z.number()
});

export type InteresCompuestoResponse = z.infer<typeof InteresCompuestoResponseSchema>;

// --- ROI ---
export const ROIRequestSchema = z.object({
  inversion: z.number().min(1, "La inversión debe ser mayor a 0"),
  beneficio: z.number()
});

export type ROIRequest = z.infer<typeof ROIRequestSchema>;

export const ROIResponseSchema = z.object({
  roi: z.number()
});

export type ROIResponse = z.infer<typeof ROIResponseSchema>;

// --- VAN / NPV ---
export const VANRequestSchema = z.object({
  tasa: z.number().min(0),
  inversionInicial: z.number(), // Usualmente negativo
  flujos: z.array(z.number())
});

export type VANRequest = z.infer<typeof VANRequestSchema>;

export const VANResponseSchema = z.object({
  van: z.number()
});

export type VANResponse = z.infer<typeof VANResponseSchema>;

// --- TIR / IRR ---
export const TIRRequestSchema = z.object({
  inversionInicial: z.number(),
  flujos: z.array(z.number())
});

export type TIRRequest = z.infer<typeof TIRRequestSchema>;

export const TIRResponseSchema = z.object({
  tir: z.number()
});

export type TIRResponse = z.infer<typeof TIRResponseSchema>;

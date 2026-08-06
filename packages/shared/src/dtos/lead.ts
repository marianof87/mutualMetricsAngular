import { z } from 'zod';

// Datos del formulario gated del lead magnet (descarga del informe en PDF).
export const LeadRequestSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre y apellido son requeridos')
    .max(120, 'El nombre y apellido son muy largos'),
  empresa: z
    .string()
    .trim()
    .min(1, 'La empresa o rubro es requerida')
    .max(120, 'La empresa o rubro es muy larga'),
  whatsapp: z
    .string()
    .trim()
    .min(6, 'El WhatsApp debe tener al menos 6 caracteres')
    .max(20, 'El WhatsApp es muy largo')
    .regex(/^[+0-9\s-]+$/, 'Formato de WhatsApp inválido'),
  email: z.string().trim().email('Formato de email inválido').max(120),
});

export type LeadRequest = z.infer<typeof LeadRequestSchema>;

export const LeadResponseSchema = z.object({
  id: z.string().uuid(),
  recibidoEn: z.string().datetime(),
});

export type LeadResponse = z.infer<typeof LeadResponseSchema>;

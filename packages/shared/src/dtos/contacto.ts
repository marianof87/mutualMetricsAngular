import { z } from 'zod';

export const ContactoRequestSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(100),
  email: z.string().trim().email('Formato de email inválido'),
  mensaje: z.string().trim().min(10, 'El mensaje debe tener al menos 10 caracteres').max(2000),
});

export type ContactoRequest = z.infer<typeof ContactoRequestSchema>;

export const ContactoResponseSchema = z.object({
  id: z.string().uuid(),
  recibidoEn: z.string().datetime(),
});

export type ContactoResponse = z.infer<typeof ContactoResponseSchema>;

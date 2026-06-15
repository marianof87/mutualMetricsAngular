import { z } from 'zod';

export const RegistrarRequestSchema = z.object({
  email: z.string().trim().email('Formato de email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(100),
});

export type RegistrarRequest = z.infer<typeof RegistrarRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().trim().email('Formato de email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// Vista pública del usuario: nunca incluye passwordHash.
export const UsuarioSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  nombre: z.string(),
});

export type Usuario = z.infer<typeof UsuarioSchema>;

export const SesionResponseSchema = z.object({
  accessToken: z.string(),
  // refreshToken queda como opcional en el contrato; el MVP no lo emite todavía.
  refreshToken: z.string().optional(),
  usuario: UsuarioSchema,
});

export type SesionResponse = z.infer<typeof SesionResponseSchema>;

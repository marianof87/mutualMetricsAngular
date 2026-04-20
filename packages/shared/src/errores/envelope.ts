import { z } from 'zod';
import { CodigoError } from './codigos';

export const EnvelopeErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    traceId: z.string().optional(),
  }),
});

export type EnvelopeError = z.infer<typeof EnvelopeErrorSchema>;

export function crearEnvelopeError(
  code: CodigoError | string,
  message: string,
  details?: unknown,
  traceId?: string,
): EnvelopeError {
  return {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      ...(traceId !== undefined ? { traceId } : {}),
    },
  };
}

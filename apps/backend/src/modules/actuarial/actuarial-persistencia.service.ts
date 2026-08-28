import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../comunes/persistencia/prisma.service';
import type {
  GuardarSimulacionActuarial,
  SimulacionActuarialRequest,
  SimulacionActuarialResponse,
} from '@mutual-metrics/shared';

/**
 * Persiste el resumen de una corrida actuarial (Monte Carlo) vinculada a un
 * Lead. Guarda solo los datos suficientes para auditoría del producto (OBJ-2),
 * no la solicitud completa.
 */
@Injectable()
export class ActuarialPersistenciaService {
  private readonly logger = new Logger(ActuarialPersistenciaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async guardar(datos: {
    solicitud: SimulacionActuarialRequest;
    resultado: SimulacionActuarialResponse;
    leadId?: string;
  }): Promise<{ id: string }> {
    const { solicitud, resultado, leadId } = datos;

    const esEstocastico =
      typeof solicitud.coeficienteB === 'object' && solicitud.coeficienteB.tipo !== 'fijo';

    const registro = await this.prisma.simulacionActuarial.create({
      data: {
        leadId: leadId ?? null,
        coeficienteBTipo: esEstocastico ? 'estocástico' : 'fijo',
        nSimulaciones: resultado.nSimulaciones,
        nivelConfianza: resultado.nivelConfianza,
        precioOptimoMedia: resultado.precioOptimo.media,
        precioOptimoP5: resultado.precioOptimo.percentiles['5'] ?? resultado.precioOptimo.intervalo.minimo,
        precioOptimoP95: resultado.precioOptimo.percentiles['95'] ?? resultado.precioOptimo.intervalo.maximo,
        pisoSolvencia: resultado.pisoSolvencia,
        probPerdidaOptimo: resultado.probabilidadPerdida.enPrecioOptimo,
        probPerdidaActual: resultado.probabilidadPerdida.enPrecioActual ?? null,
      },
    });

    this.logger.log(`Simulación actuarial guardada: id=${registro.id} leadId=${leadId ?? 'ninguno'}`);
    return { id: registro.id };
  }

  async guardarDesdeResumen(datos: GuardarSimulacionActuarial): Promise<{ id: string }> {
    const registro = await this.prisma.simulacionActuarial.create({
      data: {
        leadId: datos.leadId ?? null,
        coeficienteBTipo: datos.coeficienteBTipo,
        nSimulaciones: datos.nSimulaciones,
        nivelConfianza: datos.nivelConfianza,
        precioOptimoMedia: datos.precioOptimoMedia,
        precioOptimoP5: datos.precioOptimoP5,
        precioOptimoP95: datos.precioOptimoP95,
        pisoSolvencia: datos.pisoSolvencia,
        probPerdidaOptimo: datos.probPerdidaOptimo,
        probPerdidaActual: datos.probPerdidaActual,
      },
    });

    this.logger.log(`Simulación actuarial guardada (resumen): id=${registro.id}`);
    return { id: registro.id };
  }
}

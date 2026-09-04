import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { EscenarioCreateRequest, EscenarioResponse, Paginado } from '@mutual-metrics/shared';
import { CodigoError } from '@mutual-metrics/shared';
import { PrismaService } from '../../comunes/persistencia/prisma.service';

// Fila tal como la persiste Prisma (inputs/outputs como JSON stringified).
interface FilaEscenario {
  id: string;
  tipo: string;
  inputs: string;
  outputs: string;
  creadoEn: Date;
}

@Injectable()
export class EscenariosService {
  private readonly logger = new Logger(EscenariosService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Persiste un escenario del usuario autenticado.
  async crear(usuarioId: string, dto: EscenarioCreateRequest): Promise<EscenarioResponse> {
    const escenario = await this.prisma.escenario.create({
      data: {
        usuarioId,
        tipo: dto.tipo,
        // SQLite no tiene tipo JSON nativo: serializamos a string.
        inputs: JSON.stringify(dto.inputs),
        outputs: JSON.stringify(dto.outputs),
      },
    });
    this.logger.log(`Escenario creado: id=${escenario.id} tipo=${dto.tipo}`);
    return this.aPublico(escenario);
  }

  // Lista paginada de escenarios, scoped al usuario autenticado.
  // El filtro `tipo` es opcional: si llega, acota la consulta a ese tipo de cálculo.
  async listar(usuarioId: string, page: number = 1, tamano: number = 20, tipo?: EscenarioResponse['tipo']): Promise<Paginado<EscenarioResponse>> {
    const skip = (page - 1) * tamano;
    const where = tipo ? { usuarioId, tipo } : { usuarioId };

    const [datos, total] = await Promise.all([
      this.prisma.escenario.findMany({
        where,
        skip,
        take: tamano,
        orderBy: { creadoEn: 'desc' },
      }),
      this.prisma.escenario.count({ where }),
    ]);

    return {
      datos: datos.map((e) => this.aPublico(e)),
      total,
      pagina: page,
      tamano,
    };
  }

  // Detalle por id, scoped al usuario. Inexistente O ajeno -> 404 (no filtramos).
  async obtenerPorId(usuarioId: string, id: string): Promise<EscenarioResponse> {
    const escenario = await this.prisma.escenario.findFirst({
      where: { id, usuarioId },
    });
    if (!escenario) {
      throw new NotFoundException({
        code: CodigoError.ESCENARIOS_NO_ENCONTRADO,
        message: 'Escenario no encontrado',
      });
    }
    return this.aPublico(escenario);
  }

  // Borra por id, scoped al usuario. Devuelve void (el controller responde 204).
  async eliminar(usuarioId: string, id: string): Promise<void> {
    const escenario = await this.prisma.escenario.findFirst({
      where: { id, usuarioId },
    });
    if (!escenario) {
      throw new NotFoundException({
        code: CodigoError.ESCENARIOS_NO_ENCONTRADO,
        message: 'Escenario no encontrado',
      });
    }
    await this.prisma.escenario.delete({ where: { id } });
    this.logger.log(`Escenario eliminado: id=${id}`);
  }

  // Convierte fila Prisma -> respuesta pública. No expone usuarioId.
  // Ante JSON corrupto en inputs/outputs devuelve {} y loguea (no crashea).
  private aPublico(escenario: FilaEscenario): EscenarioResponse {
    return {
      id: escenario.id,
      tipo: escenario.tipo as EscenarioResponse['tipo'],
      inputs: this.parseJson(escenario.inputs, 'inputs'),
      outputs: this.parseJson(escenario.outputs, 'outputs'),
      creadoEn: escenario.creadoEn.toISOString(),
    };
  }

  private parseJson(valor: string, campo: string): Record<string, unknown> {
    try {
      return JSON.parse(valor) as Record<string, unknown>;
    } catch {
      // Datos corruptos (no deberia pasar en flujo normal): no rompemos la respuesta.
      this.logger.warn(`JSON corrupto en escenario (campo ${campo}): se devuelve objeto vacio`);
      return {};
    }
  }
}

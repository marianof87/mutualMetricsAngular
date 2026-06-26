import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../comunes/persistencia/prisma.service';
import type { CrearNovedadRequest, NovedadResponse, Paginado } from '@mutual-metrics/shared';

@Injectable()
export class NovedadesService {
  private readonly logger = new Logger(NovedadesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listar(page: number = 1, tamano: number = 20): Promise<Paginado<NovedadResponse>> {
    const skip = (page - 1) * tamano;
    
    const [datos, total] = await Promise.all([
      this.prisma.novedad.findMany({
        skip,
        take: tamano,
        orderBy: { fechaCreacion: 'desc' },
      }),
      this.prisma.novedad.count(),
    ]);

    return {
      datos: datos.map(this.mapToResponse),
      total,
      pagina: page,
      tamano,
    };
  }

  async crear(dto: CrearNovedadRequest): Promise<NovedadResponse> {
    const novedad = await this.prisma.novedad.create({
      data: {
        titulo: dto.titulo,
        contenido: dto.contenido,
        imagenUrl: dto.imagenUrl,
      },
    });

    this.logger.log(`Novedad creada: id=${novedad.id} titulo=${novedad.titulo}`);
    return this.mapToResponse(novedad);
  }

  private mapToResponse(novedad: any): NovedadResponse {
    return {
      id: novedad.id,
      titulo: novedad.titulo,
      contenido: novedad.contenido,
      imagenUrl: novedad.imagenUrl,
      fechaCreacion: novedad.fechaCreacion.toISOString(),
    };
  }
}

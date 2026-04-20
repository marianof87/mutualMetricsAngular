import { Injectable } from '@nestjs/common';

@Injectable()
export class SobreNosotrosService {
  obtenerInfo(): { titulo: string; descripcion: string } {
    return {
      titulo: 'MutualMetrics — Proyecto universitario',
      descripcion: 'Reemplazar con información real del equipo y la institución.',
    };
  }
}

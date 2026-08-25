import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  GuardarSimulacionActuarial,
  SimulacionActuarialRequest,
  SimulacionActuarialResponse,
} from '@mutual-metrics/shared';
import { entorno } from '../../core/configuracion/entorno';

@Injectable({ providedIn: 'root' })
export class ActuarialService {
  private readonly http = inject(HttpClient);

  simular(solicitud: SimulacionActuarialRequest): Observable<SimulacionActuarialResponse> {
    return this.http.post<SimulacionActuarialResponse>(
      `${entorno.apiBaseUrl}/actuarial/simulaciones`,
      solicitud,
    );
  }

  guardar(datos: GuardarSimulacionActuarial): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(
      `${entorno.apiBaseUrl}/actuarial/simulaciones/guardar`,
      datos,
    );
  }
}
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
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
}
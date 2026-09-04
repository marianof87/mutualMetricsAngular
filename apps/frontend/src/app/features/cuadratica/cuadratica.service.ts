import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { CuadraticaRequest, CuadraticaResponse } from '@mutual-metrics/shared';
import { entorno } from '../../core/configuracion/entorno';

@Injectable({ providedIn: 'root' })
export class CuadraticaService {
  private readonly http = inject(HttpClient);

  resolver(dto: CuadraticaRequest): Observable<CuadraticaResponse> {
    return this.http.post<CuadraticaResponse>(`${entorno.apiBaseUrl}/cuadratica/resolver`, dto);
  }
}

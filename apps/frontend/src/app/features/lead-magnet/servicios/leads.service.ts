import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { LeadRequest, LeadResponse } from '@mutual-metrics/shared';
import { entorno } from '../../../core/configuracion/entorno';

@Injectable({ providedIn: 'root' })
export class LeadsService {
  private readonly http = inject(HttpClient);

  registrar(datos: LeadRequest): Observable<LeadResponse> {
    return this.http.post<LeadResponse>(`${entorno.apiBaseUrl}/leads`, datos);
  }
}

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { EscenarioResponse, Paginado } from '@mutual-metrics/shared';
import { entorno } from '../../core/configuracion/entorno';

@Injectable({ providedIn: 'root' })
export class HistorialService {
  private readonly http = inject(HttpClient);

  listar(pagina = 1, tamano = 20): Observable<Paginado<EscenarioResponse>> {
    const params = new HttpParams().set('page', String(pagina)).set('tamano', String(tamano));
    return this.http.get<Paginado<EscenarioResponse>>(`${entorno.apiBaseUrl}/escenarios`, { params });
  }

  borrar(id: string): Observable<void> {
    return this.http.delete<void>(`${entorno.apiBaseUrl}/escenarios/${id}`);
  }

  obtenerPorId(id: string): Observable<EscenarioResponse> {
    return this.http.get<EscenarioResponse>(`${entorno.apiBaseUrl}/escenarios/${id}`);
  }
}

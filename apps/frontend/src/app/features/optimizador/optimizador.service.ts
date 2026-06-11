import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OptimizarPrecioRequest, OptimizarPrecioResponse } from '@mutual-metrics/shared';

@Injectable({
  providedIn: 'root'
})
export class OptimizadorFrontendService {
  // URL perfectamente alineada con el main.ts del backend
  private readonly apiUrl = 'http://localhost:3000/api/v1/optimizador/calcular';

  constructor(private readonly http: HttpClient) {}

  enviarCalculo(datos: OptimizarPrecioRequest): Observable<OptimizarPrecioResponse> {
    return this.http.post<OptimizarPrecioResponse>(this.apiUrl, datos);
  }
}
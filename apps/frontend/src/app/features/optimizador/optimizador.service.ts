import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OptimizarPrecioRequest, OptimizarPrecioResponse } from '@mutual-metrics/shared';

@Injectable({
  providedIn: 'root'
})
export class OptimizadorFrontendService {
  // Apunta directo a tu NestJS local
  private readonly apiUrl = 'http://localhost:3000/optimizador/calcular';

  constructor(private readonly http: HttpClient) {}

  // Corregido: OptimizarPrecioRequest con 'a'
  enviarCalculo(datos: OptimizarPrecioRequest): Observable<OptimizarPrecioResponse> {
    return this.http.post<OptimizarPrecioResponse>(this.apiUrl, datos);
  }
}
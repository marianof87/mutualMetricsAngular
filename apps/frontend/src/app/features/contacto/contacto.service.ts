import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ContactoRequest, ContactoResponse } from '@mutual-metrics/shared';
import { entorno } from '../../core/configuracion/entorno';

@Injectable({ providedIn: 'root' })
export class ContactoService {
  private readonly http = inject(HttpClient);

  enviar(dto: ContactoRequest): Observable<ContactoResponse> {
    return this.http.post<ContactoResponse>(`${entorno.apiBaseUrl}/contactos`, dto);
  }
}

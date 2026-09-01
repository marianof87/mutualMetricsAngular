import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CODIGOS_TOKEN_RECHAZADO, type EnvelopeError } from '@mutual-metrics/shared';
import type {
  LoginRequest,
  RegistrarRequest,
  SesionResponse,
  Usuario,
} from '@mutual-metrics/shared';
import { entorno } from '../configuracion/entorno';
import { OMITIR_REDIRECCION_SESION } from '../interceptores/contexto-http';

const CLAVE_ALMACEN = 'mm_sesion';

interface SesionAlmacenada {
  accessToken: string;
  usuario: Usuario;
}

// Estado de sesión global: usuario autenticado (signal) + token para el interceptor.
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly http = inject(HttpClient);

  private readonly _usuario = signal<Usuario | null>(null);
  private token: string | null = null;

  readonly usuarioActual = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._usuario() !== null);

  constructor() {
    this.hidratar();
  }

  registrar(dto: RegistrarRequest): Observable<SesionResponse> {
    return this.http
      .post<SesionResponse>(`${entorno.apiBaseUrl}/auth/registrar`, dto)
      .pipe(tap((sesion) => this.guardar(sesion)));
  }

  iniciarSesion(dto: LoginRequest): Observable<SesionResponse> {
    return this.http
      .post<SesionResponse>(`${entorno.apiBaseUrl}/auth/login`, dto)
      .pipe(tap((sesion) => this.guardar(sesion)));
  }

  cerrarSesion(): void {
    this.token = null;
    this._usuario.set(null);
    this.almacen?.removeItem(CLAVE_ALMACEN);
  }

  obtenerToken(): string | null {
    return this.token;
  }

  private guardar(sesion: SesionResponse): void {
    this.token = sesion.accessToken;
    this._usuario.set(sesion.usuario);
    const datos: SesionAlmacenada = {
      accessToken: sesion.accessToken,
      usuario: sesion.usuario,
    };
    this.almacen?.setItem(CLAVE_ALMACEN, JSON.stringify(datos));
  }

  // Verifica el token guardado contra el backend (GET /usuarios/yo) y
  // refresca los datos del usuario. Si el backend rechaza el token, limpia
  // la sesión obsoleta; ante un error transitorio, conserva la sesión.
  //
  // IMPORTANTE: se invoca desde provideAppInitializer (app.config.ts), NO
  // desde el constructor. Llamarlo en el constructor dispara la request
  // mientras el servicio aún se construye, y como los interceptores HTTP
  // inyectan SesionService, se produce una dependencia circular que termina
  // cerrando la sesión en cada refresh.
  revalidar(): void {
    if (!this.token) return;
    this.http
      .get<Usuario>(`${entorno.apiBaseUrl}/usuarios/yo`, {
        context: new HttpContext().set(OMITIR_REDIRECCION_SESION, true),
      })
      .subscribe({
        next: (usuario) => this._usuario.set(usuario),
        error: (envelope: EnvelopeError) => {
          if (CODIGOS_TOKEN_RECHAZADO.includes(envelope?.error?.code)) {
            this.cerrarSesion();
          }
        },
      });
  }

  private hidratar(): void {
    const crudo = this.almacen?.getItem(CLAVE_ALMACEN);
    if (!crudo) return;
    try {
      const datos = JSON.parse(crudo) as SesionAlmacenada;
      this.token = datos.accessToken;
      this._usuario.set(datos.usuario);
    } catch {
      this.almacen?.removeItem(CLAVE_ALMACEN);
    }
  }

  // localStorage no existe durante el render en servidor (SSR).
  private get almacen(): Storage | null {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  }
}

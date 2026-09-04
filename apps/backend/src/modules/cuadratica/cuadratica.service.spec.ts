import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { CodigoError } from '@mutual-metrics/shared';
import { CuadraticaService } from './cuadratica.service';
import type { CuadraticaRequest } from '@mutual-metrics/shared';

// Nota de diseño: jest.spyOn(shared, 'resolverCuadratica') NO es posible aquí.
// packages/shared/src/index.ts re-exporta el dominio con `export *` → TypeScript genera
// un getter no-configurable (__createBinding), y spyOn lanza "Cannot redefine property".
// La alternativa limpia es mockear el módulo conservando la implementación real por default
// y anularla por caso con mockImplementationOnce.
jest.mock('@mutual-metrics/shared', () => {
  const real = jest.requireActual('@mutual-metrics/shared');
  return {
    ...real,
    resolverCuadratica: jest.fn(real.resolverCuadratica),
  };
});

// Espía de la función de dominio dentro del módulo mockeado (equivalente a un spyOn).
const sharedMock = jest.requireMock('@mutual-metrics/shared') as {
  resolverCuadratica: jest.Mock;
};

describe('CuadraticaService', () => {
  let servicio: CuadraticaService;

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [CuadraticaService],
    }).compile();

    servicio = modulo.get<CuadraticaService>(CuadraticaService);
  });

  afterEach(() => {
    sharedMock.resolverCuadratica.mockClear();
  });

  it('resuelve D>0: {1,-3,2} → D=1, dosReales, raices [1,2], vertice {1.5,-0.25}', () => {
    const dto: CuadraticaRequest = { a: 1, b: -3, c: 2 };
    const res = servicio.resolver(dto);

    expect(res.discriminante).toBe(1);
    expect(res.tipo).toBe('dosReales');
    expect(res.raices).toEqual([1, 2]);
    expect(res.vertice).toEqual({ x: 1.5, y: -0.25 });
  });

  it('resuelve D=0: {1,2,1} → D=0, unaRealDoble, raices [-1,-1], vertice {-1,0}', () => {
    const dto: CuadraticaRequest = { a: 1, b: 2, c: 1 };
    const res = servicio.resolver(dto);

    expect(res.discriminante).toBe(0);
    expect(res.tipo).toBe('unaRealDoble');
    expect(res.raices).toEqual([-1, -1]);
    expect(res.vertice).toEqual({ x: -1, y: 0 });
  });

  it('resuelve D<0: {1,0,1} → D=-4, sinRaicesReales, raices null, vertice {0,1}', () => {
    const dto: CuadraticaRequest = { a: 1, b: 0, c: 1 };
    const res = servicio.resolver(dto);

    expect(res.discriminante).toBe(-4);
    expect(res.tipo).toBe('sinRaicesReales');
    expect(res.raices).toBeNull();
    // b=0 produce -0 en JS: se compara con toBeCloseTo (0 y -0 son el mismo valor).
    expect(res.vertice.x).toBeCloseTo(0);
    expect(res.vertice.y).toBeCloseTo(1);
  });

  it('traduce CUADRATICA_A_CERO (a=0) a UnprocessableEntityException con status 422', () => {
    const dto: CuadraticaRequest = { a: 0, b: 2, c: 1 };
    const error = obtenerError(() => servicio.resolver(dto));

    expect(error).toBeInstanceOf(UnprocessableEntityException);
    const excepcion = error as UnprocessableEntityException;
    expect(excepcion.getStatus()).toBe(422);
    expect((excepcion.getResponse() as { code: string }).code).toBe(
      CodigoError.CUADRATICA_A_CERO,
    );
  });

  it('re-lanza errores del dominio que no son CUADRATICA_A_CERO sin encapsularlos', () => {
    const errorGenerico = new Error('OTRO_ERROR');
    sharedMock.resolverCuadratica.mockImplementationOnce(() => {
      throw errorGenerico;
    });

    expect(() => servicio.resolver({ a: 1, b: 2, c: 1 })).toThrow('OTRO_ERROR');
    expect(sharedMock.resolverCuadratica).toHaveBeenCalledTimes(1);
  });
});

function obtenerError(ejecutar: () => unknown): unknown {
  try {
    ejecutar();
  } catch (error) {
    return error;
  }
  throw new Error('La función esperaba lanzar una excepción');
}

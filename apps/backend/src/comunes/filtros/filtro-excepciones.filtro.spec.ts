import { HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { Response } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { CodigoError } from '@mutual-metrics/shared';
import { FiltroExcepcionesGlobal } from './filtro-excepciones.filtro';

describe('FiltroExcepcionesGlobal', () => {
  let filtro: FiltroExcepcionesGlobal;
  let responseMock: { status: jest.Mock; json: jest.Mock };
  let hostMock: ArgumentsHost;

  const armarHost = (): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getResponse: () => responseMock as unknown as Response,
      }),
    }) as unknown as ArgumentsHost;

  beforeEach(() => {
    filtro = new FiltroExcepcionesGlobal();
    responseMock = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    hostMock = armarHost();
  });

  it('normaliza un error de Zod como 422 ENTRADA_INVALIDA con detalles', () => {
    const problema: ZodIssue = {
      code: 'custom',
      path: ['email'],
      message: 'Email inválido',
    };

    filtro.catch(new ZodError([problema]), hostMock);

    expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(responseMock.json).toHaveBeenCalledWith({
      error: {
        code: CodigoError.ENTRADA_INVALIDA,
        message: 'Los datos enviados no son válidos',
        details: [problema],
      },
    });
  });

  it('usa code/message/details propios de un HttpException con cuerpo estructurado', () => {
    filtro.catch(
      new HttpException(
        { code: CodigoError.CONTACTO_EMAIL_INVALIDO, message: 'Email inválido', details: { campo: 'email' } },
        HttpStatus.BAD_REQUEST,
      ),
      hostMock,
    );

    expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(responseMock.json).toHaveBeenCalledWith({
      error: {
        code: CodigoError.CONTACTO_EMAIL_INVALIDO,
        message: 'Email inválido',
        details: { campo: 'email' },
      },
    });
  });

  it('mapea el código por defecto cuando el HttpException no trae code propio', () => {
    filtro.catch(new HttpException('No encontrado', HttpStatus.NOT_FOUND), hostMock);

    expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(responseMock.json).toHaveBeenCalledWith({
      error: {
        code: CodigoError.RECURSO_NO_ENCONTRADO,
        message: 'No encontrado',
      },
    });
  });

  it('mapea cada status HTTP conocido a su código y registra los errores 5xx', () => {
    const casos: [number, string][] = [
      [HttpStatus.BAD_REQUEST, CodigoError.ENTRADA_INVALIDA],
      [HttpStatus.UNAUTHORIZED, CodigoError.NO_AUTORIZADO],
      [HttpStatus.FORBIDDEN, CodigoError.PROHIBIDO],
      [HttpStatus.NOT_FOUND, CodigoError.RECURSO_NO_ENCONTRADO],
      [HttpStatus.CONFLICT, CodigoError.CONFLICTO],
      [HttpStatus.TOO_MANY_REQUESTS, CodigoError.LIMITE_EXCEDIDO],
      [HttpStatus.SERVICE_UNAVAILABLE, CodigoError.SERVICIO_NO_DISPONIBLE],
    ];

    for (const [status, codigoEsperado] of casos) {
      filtro.catch(new HttpException('X', status), hostMock);
      expect(responseMock.status).toHaveBeenCalledWith(status);
      expect(responseMock.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.objectContaining({ code: codigoEsperado }) }),
      );
    }

    filtro.catch(new HttpException('Error interno', HttpStatus.INTERNAL_SERVER_ERROR), hostMock);
    expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(responseMock.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: CodigoError.ERROR_INTERNO }) }),
    );
  });

  it('devuelve el código default para un status sin mapeo propio', () => {
    filtro.catch(new HttpException('raro', HttpStatus.I_AM_A_TEAPOT), hostMock);

    expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.I_AM_A_TEAPOT);
    expect(responseMock.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: CodigoError.ERROR_INTERNO }) }),
    );
  });

  it('traduce un error inesperado a 500 ERROR_INTERNO con mensaje genérico', () => {
    filtro.catch(new Error('boom'), hostMock);

    expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(responseMock.json).toHaveBeenCalledWith({
      error: {
        code: CodigoError.ERROR_INTERNO,
        message: 'Ocurrió un error inesperado',
      },
    });
  });
});
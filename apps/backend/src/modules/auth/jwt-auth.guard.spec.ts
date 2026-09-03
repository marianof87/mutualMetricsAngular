import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CodigoError } from '@mutual-metrics/shared';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { ExecutionContext } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtMock: { verify: jest.Mock };

  const crearContexto = (authorization?: string): ExecutionContext => {
    const request: any = {
      headers: authorization !== undefined ? { authorization } : {},
      usuario: undefined,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getRequest: () => request,
    } as unknown as ExecutionContext;
  };

  const getRequest = (context: ExecutionContext): any => context.switchToHttp().getRequest();

  beforeEach(() => {
    jwtMock = { verify: jest.fn() };
    guard = new JwtAuthGuard(jwtMock as unknown as JwtService);
  });

  it('lanza AUTH_TOKEN_INVALIDO si no hay header authorization', () => {
    const context = crearContexto(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);

    try {
      guard.canActivate(context);
    } catch (e) {
      const err = e as UnauthorizedException;
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.getResponse()).toMatchObject({
        code: CodigoError.AUTH_TOKEN_INVALIDO,
        message: 'Falta el token de autenticación',
      });
    }
    expect(jwtMock.verify).not.toHaveBeenCalled();
  });

  it('lanza AUTH_TOKEN_INVALIDO si el header no tiene prefijo Bearer (ej. Basic)', () => {
    const context = crearContexto('Basic xxx');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);

    try {
      guard.canActivate(context);
    } catch (e) {
      expect((e as UnauthorizedException).getResponse()).toMatchObject({
        code: CodigoError.AUTH_TOKEN_INVALIDO,
        message: 'Falta el token de autenticación',
      });
    }
    expect(jwtMock.verify).not.toHaveBeenCalled();
  });

  it('lanza AUTH_TOKEN_INVALIDO si el header es cadena vacia', () => {
    const context = crearContexto('');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(jwtMock.verify).not.toHaveBeenCalled();
  });

  it('verifica token valido, setea request.usuario y retorna true', () => {
    const payload = { sub: 'u1', email: 'ana@example.com' };
    jwtMock.verify.mockReturnValue(payload);
    const context = crearContexto('Bearer token.valido.123');
    const request = getRequest(context);

    const resultado = guard.canActivate(context);

    expect(resultado).toBe(true);
    expect(jwtMock.verify).toHaveBeenCalledTimes(1);
    expect(jwtMock.verify).toHaveBeenCalledWith('token.valido.123');
    expect(request.usuario).toEqual(payload);
  });

  it('lanza AUTH_TOKEN_EXPIRADO si verify arroja TokenExpiredError', () => {
    const error = new Error('jwt expired');
    (error as any).name = 'TokenExpiredError';
    jwtMock.verify.mockImplementation(() => {
      throw error;
    });
    const context = crearContexto('Bearer token.expirado');

    try {
      guard.canActivate(context);
      fail('deberia haber lanzado UnauthorizedException');
    } catch (e) {
      const err = e as UnauthorizedException;
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.getResponse()).toMatchObject({
        code: CodigoError.AUTH_TOKEN_EXPIRADO,
        message: 'El token expiró',
      });
    }
    expect(jwtMock.verify).toHaveBeenCalledWith('token.expirado');
    expect(getRequest(context).usuario).toBeUndefined();
  });

  it('lanza AUTH_TOKEN_INVALIDO si verify arroja error generico (firma invalida)', () => {
    jwtMock.verify.mockImplementation(() => {
      throw new Error('invalid signature');
    });
    const context = crearContexto('Bearer token.invalido');

    try {
      guard.canActivate(context);
      fail('deberia haber lanzado UnauthorizedException');
    } catch (e) {
      const err = e as UnauthorizedException;
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.getResponse()).toMatchObject({
        code: CodigoError.AUTH_TOKEN_INVALIDO,
        message: 'Token de autenticación inválido',
      });
    }
    expect(jwtMock.verify).toHaveBeenCalledWith('token.invalido');
  });

  it('lanza AUTH_TOKEN_INVALIDO si verify arroja error sin name TokenExpiredError', () => {
    const error = new Error('jwt malformed');
    (error as any).name = 'JsonWebTokenError';
    jwtMock.verify.mockImplementation(() => {
      throw error;
    });
    const context = crearContexto('Bearer token.malformado');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    try {
      guard.canActivate(context);
    } catch (e) {
      expect((e as UnauthorizedException).getResponse()).toMatchObject({
        code: CodigoError.AUTH_TOKEN_INVALIDO,
      });
    }
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { FinanzasService } from './finanzas.service';

describe('FinanzasService', () => {
  let servicio: FinanzasService;

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [FinanzasService],
    }).compile();

    servicio = modulo.get<FinanzasService>(FinanzasService);
  });

  describe('interesSimple', () => {
    it('calcula interes y total para valores tipicos (1000, 0.05, 2)', () => {
      const resultado = servicio.interesSimple({ principal: 1000, tasa: 0.05, tiempo: 2 });
      expect(resultado).toEqual({ interes: 100, total: 1100 });
    });

    it('devuelve interes 0 cuando tasa es 0 (caso borde)', () => {
      const resultado = servicio.interesSimple({ principal: 1000, tasa: 0, tiempo: 2 });
      expect(resultado).toEqual({ interes: 0, total: 1000 });
    });

    it('devuelve interes 0 cuando tiempo es 0', () => {
      const resultado = servicio.interesSimple({ principal: 5000, tasa: 0.1, tiempo: 0 });
      expect(resultado).toEqual({ interes: 0, total: 5000 });
    });
  });

  describe('interesCompuesto', () => {
    it('calcula interes compuesto anual por defecto (1000, 0.1, 2)', () => {
      const { interes, total } = servicio.interesCompuesto({
        principal: 1000,
        tasa: 0.1,
        tiempo: 2,
        frecuencia: 1,
      });
      expect(total).toBeCloseTo(1210, 6);
      expect(interes).toBeCloseTo(210, 6);
    });

    it('usa frecuencia 1 por defecto si no se especifica', () => {
      const conFrecuencia = servicio.interesCompuesto({
        principal: 1000,
        tasa: 0.1,
        tiempo: 2,
        frecuencia: 1,
      });
      // llamada sin frecuencia explicita debe delegar con default 1 -> mismo resultado
      const sinFrecuencia = servicio.interesCompuesto({
        principal: 1000,
        tasa: 0.1,
        tiempo: 2,
      } as any);
      expect(sinFrecuencia.total).toBeCloseTo(conFrecuencia.total, 6);
      expect(sinFrecuencia.interes).toBeCloseTo(conFrecuencia.interes, 6);
    });

    it('genera mas interes con capitalizacion mensual que anual', () => {
      const anual = servicio.interesCompuesto({ principal: 1000, tasa: 0.12, tiempo: 1, frecuencia: 1 });
      const mensual = servicio.interesCompuesto({ principal: 1000, tasa: 0.12, tiempo: 1, frecuencia: 12 });
      expect(mensual.total).toBeGreaterThan(anual.total);
      // valor determinista mensual: 1000*(1+0.12/12)^12 ~= 1126.825
      expect(mensual.total).toBeCloseTo(1126.82503013, 4);
    });
  });

  describe('roi', () => {
    it('calcula ROI tipico (inversion 1000, beneficio 1500) => 50%', () => {
      const resultado = servicio.roi({ inversion: 1000, beneficio: 1500 });
      expect(resultado).toEqual({ roi: 50 });
    });

    it('devuelve ROI negativo ante perdida (1000, 800) => -20%', () => {
      const resultado = servicio.roi({ inversion: 1000, beneficio: 800 });
      expect(resultado).toEqual({ roi: -20 });
    });
  });

  describe('van', () => {
    it('con tasa 0 es suma simple de flujos mas inversion', () => {
      const resultado = servicio.van({ tasa: 0, inversionInicial: -100, flujos: [50, 50, 50] });
      expect(resultado).toEqual({ van: 50 });
    });

    it('descuenta flujos futuros con tasa 0.1', () => {
      // -1000 + 500/1.1 + 500/1.1^2 + 500/1.1^3 ~= 243.43
      const resultado = servicio.van({ tasa: 0.1, inversionInicial: -1000, flujos: [500, 500, 500] });
      expect(resultado.van).toBeCloseTo(243.43, 1);
    });

    it('sin flujos devuelve la inversion inicial', () => {
      const resultado = servicio.van({ tasa: 0.1, inversionInicial: -1000, flujos: [] });
      expect(resultado).toEqual({ van: -1000 });
    });
  });

  describe('tir', () => {
    it('encuentra TIR para un solo flujo (-1000, [1100]) => 0.10', () => {
      const resultado = servicio.tir({ inversionInicial: -1000, flujos: [1100] });
      expect(resultado.tir).toBeCloseTo(0.1, 4);
    });

    it('la TIR anula el VAN (verificacion cruzada)', () => {
      const { tir } = servicio.tir({ inversionInicial: -1000, flujos: [600, 600] });
      const { van } = servicio.van({ tasa: tir, inversionInicial: -1000, flujos: [600, 600] });
      expect(van).toBeCloseTo(0, 3);
    });
  });
});

import { Injectable } from '@angular/core';
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import type { LeadRequest, SimulacionActuarialResponse } from '@mutual-metrics/shared';

export interface DatosInformeActuarial {
  lead: LeadRequest;
  resultado: SimulacionActuarialResponse;
  coeficienteBTipo: 'fijo' | 'estocástico';
}

// Paleta de marca — reflejo de los tokens de styles/tokens.css.
const AZUL_PRIMARIO = rgb(0.227, 0.482, 0.835);
const AZUL_CLARO = rgb(0, 0.824, 1);
const TEXTO_OSCURO = rgb(0.067, 0.075, 0.098);
const TEXTO_TENUE = rgb(0.35, 0.38, 0.46);
const BLANCO = rgb(1, 1, 1);
const BLANCO_VELADO = rgb(0.92, 0.96, 1);
const FONDO_SUAVE = rgb(0.95, 0.96, 0.99);

const ANCHO_PAGINA = 595.28;
const ALTO_PAGINA = 841.89;

function formatoMoneda(valor: number | null): string {
  return valor === null ? '—' : `$${valor.toFixed(2)}`;
}

function formatoProbabilidad(prob: number | null | undefined): string {
  return prob == null ? '—' : `${(prob * 100).toFixed(0)}%`;
}

@Injectable({ providedIn: 'root' })
export class InformeActuarialPdfService {
  private pagina!: PDFPage;
  private fuente!: PDFFont;
  private fuenteNegrita!: PDFFont;
  private y = 0;

  /** Genera el informe en PDF y dispara la descarga en el navegador. */
  async generarPdf(datos: DatosInformeActuarial): Promise<void> {
    const bytes = await this.generarBytes(datos);
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
    const nombre = `informe-actuarial-${datos.lead.empresa.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    this.descargar(blob, nombre);
  }

  /** Construye el documento PDF sin tocar el DOM (núcleo testeable). */
  async generarBytes(datos: DatosInformeActuarial): Promise<Uint8Array> {
    const documento = await PDFDocument.create();
    this.pagina = documento.addPage([ANCHO_PAGINA, ALTO_PAGINA]);
    this.fuente = await documento.embedFont(StandardFonts.Helvetica);
    this.fuenteNegrita = await documento.embedFont(StandardFonts.HelveticaBold);
    this.y = ALTO_PAGINA - 48;

    const { lead, resultado, coeficienteBTipo } = datos;

    this.dibujarEncabezado();
    this.dibujarTitulo();
    this.dibujarBloque('Datos del negocio', [
      ['Nombre y apellido', lead.nombre],
      ['Empresa / Rubro', lead.empresa],
      ['Email laboral', lead.email],
      ['WhatsApp', lead.whatsapp],
    ]);
    this.dibujarBloque('Escenario simulado', [
      ['Coeficiente B (demanda)', coeficienteBTipo],
      ['Escenarios (Monte Carlo)', String(resultado.nSimulaciones)],
      ['Nivel de confianza', `${(resultado.nivelConfianza * 100).toFixed(0)}%`],
    ]);
    this.dibujarResultados(resultado);
    this.dibujarCta();
    this.dibujarPie();

    return await documento.save();
  }

  private dibujarEncabezado(): void {
    this.pagina.drawRectangle({
      x: 0,
      y: this.y - 110,
      width: ANCHO_PAGINA,
      height: 110,
      color: AZUL_PRIMARIO,
    });
    this.pagina.drawText('Metrix IA', { x: 48, y: this.y - 44, size: 28, font: this.fuenteNegrita, color: BLANCO });

    const subtitulo = 'Informe actuarial personalizado';
    const anchoSubtitulo = this.medir(subtitulo, 11);
    this.pagina.drawText(subtitulo, {
      x: ANCHO_PAGINA - 48 - anchoSubtitulo,
      y: this.y - 44,
      size: 11,
      font: this.fuente,
      color: BLANCO_VELADO,
    });
    this.y -= 150;
  }

  private dibujarTitulo(): void {
    this.pagina.drawText('Informe actuarial de tu negocio', {
      x: 48,
      y: this.y,
      size: 20,
      font: this.fuenteNegrita,
      color: TEXTO_OSCURO,
    });
    this.y -= 24;
    this.pagina.drawText('Simulación de riesgo basada en intervalos con probabilidad, no números falsos.', {
      x: 48,
      y: this.y,
      size: 11,
      font: this.fuente,
      color: TEXTO_TENUE,
    });
    this.y -= 34;
  }

  private dibujarBloque(titulo: string, filas: Array<[string, string]>): void {
    this.pagina.drawText(titulo, { x: 48, y: this.y, size: 13, font: this.fuenteNegrita, color: AZUL_PRIMARIO });
    this.y -= 22;

    for (const [etiqueta, valor] of filas) {
      this.pagina.drawText(etiqueta, { x: 48, y: this.y, size: 10.5, font: this.fuente, color: TEXTO_TENUE });
      this.pagina.drawText(valor, {
        x: 200,
        y: this.y,
        size: 10.5,
        font: this.fuenteNegrita,
        color: TEXTO_OSCURO,
      });
      this.y -= 21;
    }

    this.pagina.drawRectangle({
      x: 48,
      y: this.y + 4,
      width: ANCHO_PAGINA - 96,
      height: 0.6,
      color: FONDO_SUAVE,
    });
    this.y -= 24;
  }

  private dibujarResultados(resultado: SimulacionActuarialResponse): void {
    const p5 = resultado.precioOptimo.percentiles['5'] ?? resultado.precioOptimo.intervalo.minimo;
    const p95 = resultado.precioOptimo.percentiles['95'] ?? resultado.precioOptimo.intervalo.maximo;

    this.pagina.drawRectangle({
      x: 48,
      y: this.y - 108,
      width: ANCHO_PAGINA - 96,
      height: 108,
      color: FONDO_SUAVE,
    });

    this.pagina.drawText('Precio óptimo sugerido', { x: 72, y: this.y - 34, size: 11, font: this.fuente, color: TEXTO_TENUE });
    this.pagina.drawText(formatoMoneda(resultado.precioOptimo.media), {
      x: 72,
      y: this.y - 64,
      size: 26,
      font: this.fuenteNegrita,
      color: TEXTO_OSCURO,
    });

    const xRango = ANCHO_PAGINA / 2 + 24;
    this.pagina.drawText('Probabilidad de pérdida', { x: xRango, y: this.y - 34, size: 11, font: this.fuente, color: TEXTO_TENUE });
    this.pagina.drawText(formatoProbabilidad(resultado.probabilidadPerdida.enPrecioOptimo), {
      x: xRango,
      y: this.y - 64,
      size: 26,
      font: this.fuenteNegrita,
      color: AZUL_CLARO,
    });
    this.y -= 132;

    this.dibujarBloque('Métricas del escenario', [
      ['Rango probable del precio óptimo (P5–P95)', `${formatoMoneda(p5)} – ${formatoMoneda(p95)}`],
      ['Piso de solvencia', formatoMoneda(resultado.pisoSolvencia)],
      ['Punto de equilibrio', formatoMoneda(resultado.puntoEquilibrio.media)],
      ['Ganancia máxima estimada', formatoMoneda(resultado.gananciaMaxima.media)],
    ]);

    if (resultado.probabilidadPerdida.enPrecioActual != null) {
      this.y -= 6;
      this.y = this.dibujarTexto(
        `Con tu precio actual ($), la probabilidad de pérdida es ${formatoProbabilidad(resultado.probabilidadPerdida.enPrecioActual)}.`,
        48,
        this.y,
        10.5,
        TEXTO_TENUE,
      );
      this.y -= 16;
    }
  }

  private dibujarCta(): void {
    this.pagina.drawRectangle({
      x: 48,
      y: this.y - 96,
      width: ANCHO_PAGINA - 96,
      height: 96,
      color: AZUL_PRIMARIO,
    });

    this.pagina.drawText('¿Listo para llevar esta estrategia a tu negocio?', {
      x: 72,
      y: this.y - 30,
      size: 14,
      font: this.fuenteNegrita,
      color: BLANCO,
    });
    this.y -= 54;
    this.y = this.dibujarTexto(
      'Agendá un diagnóstico gratuito de 30 minutos con un especialista de Metrix IA.',
      72,
      this.y,
      11,
      BLANCO,
    );
    this.y -= 60;
  }

  private dibujarPie(): void {
    const mensaje =
      'Este informe es una simulación orientativa generada automáticamente y no constituye asesoramiento profesional.';
    const tramos = this.dividirEnLineas(mensaje, 10, ANCHO_PAGINA - 96);
    tramos.forEach((linea, i) => {
      this.pagina.drawText(linea, {
        x: 48,
        y: ALTO_PAGINA - 56 - i * 15,
        size: 10,
        font: this.fuente,
        color: TEXTO_TENUE,
      });
    });
  }

  private dibujarTexto(texto: string, x: number, y: number, tamanio: number, color: RGB): number {
    const anchoMaximo = ANCHO_PAGINA - 104;
    const lineas = this.dividirEnLineas(texto, tamanio, anchoMaximo);
    let cursor = y;
    for (const linea of lineas) {
      this.pagina.drawText(linea, { x, y: cursor, size: tamanio, font: this.fuente, color });
      cursor -= tamanio + 4;
    }
    return cursor;
  }

  private dividirEnLineas(texto: string, tamanio: number, anchoMaximo: number): string[] {
    const lineas: string[] = [];
    let actual = '';
    for (const palabra of texto.split(' ')) {
      const candidata = actual ? `${actual} ${palabra}` : palabra;
      if (this.medir(candidata, tamanio) <= anchoMaximo || !actual) {
        actual = candidata;
      } else {
        lineas.push(actual);
        actual = palabra;
      }
    }
    if (actual) {
      lineas.push(actual);
    }
    return lineas;
  }

  private medir(texto: string, tamanio: number): number {
    return this.fuente.widthOfTextAtSize(texto, tamanio);
  }

  private descargar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  }
}
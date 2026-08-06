import { Injectable } from '@angular/core';
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import type { LeadRequest, OptimizarPrecioResponse } from '@mutual-metrics/shared';

export interface DatosInforme {
  lead: LeadRequest;
  resultados: OptimizarPrecioResponse;
  coeficientes: { a: number; b: number; c: number };
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

@Injectable({ providedIn: 'root' })
export class InformePdfService {
  private pagina!: PDFPage;
  private fuente!: PDFFont;
  private fuenteNegrita!: PDFFont;
  private y = 0;

  /** Genera el informe en PDF y dispara la descarga en el navegador. */
  async generarPdf(datos: DatosInforme): Promise<void> {
    const documento = await PDFDocument.create();
    this.pagina = documento.addPage([ANCHO_PAGINA, ALTO_PAGINA]);
    this.fuente = await documento.embedFont(StandardFonts.Helvetica);
    this.fuenteNegrita = await documento.embedFont(StandardFonts.HelveticaBold);
    this.y = ALTO_PAGINA - 48;

    this.dibujarEncabezado();
    this.dibujarTitulo();
    this.dibujarBloque('Datos del negocio', [
      ['Nombre y apellido', datos.lead.nombre],
      ['Empresa / Rubro', datos.lead.empresa],
      ['Email laboral', datos.lead.email],
      ['WhatsApp', datos.lead.whatsapp],
    ]);
    this.dibujarBloque('Escenario simulado', [
      ['Coeficiente A (sensibilidad)', String(datos.coeficientes.a)],
      ['Coeficiente B (demanda)', String(datos.coeficientes.b)],
      ['Coeficiente C (costos fijos)', String(datos.coeficientes.c)],
    ]);
    this.dibujarResultados(datos.resultados);
    this.dibujarCta();
    this.dibujarPie();

    const bytes = await documento.save();
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
    const nombre = `informe-sinaptek-${datos.lead.empresa.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    this.descargar(blob, nombre);
  }

  private dibujarEncabezado(): void {
    this.pagina.drawRectangle({
      x: 0,
      y: this.y - 110,
      width: ANCHO_PAGINA,
      height: 110,
      color: AZUL_PRIMARIO,
    });
    this.pagina.drawText('Sinaptek', { x: 48, y: this.y - 44, size: 28, font: this.fuenteNegrita, color: BLANCO });

    const subtitulo = 'Informe personalizado de precios';
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
    this.pagina.drawText('Informe de valor de tu negocio', {
      x: 48,
      y: this.y,
      size: 20,
      font: this.fuenteNegrita,
      color: TEXTO_OSCURO,
    });
    this.y -= 24;
    this.pagina.drawText('Simulación personalizada generada con la herramienta de Sinaptek.', {
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

  private dibujarResultados(resultados: OptimizarPrecioResponse): void {
    this.pagina.drawRectangle({
      x: 48,
      y: this.y - 108,
      width: ANCHO_PAGINA - 96,
      height: 108,
      color: FONDO_SUAVE,
    });

    this.pagina.drawText('Precio óptimo sugerido', { x: 72, y: this.y - 34, size: 11, font: this.fuente, color: TEXTO_TENUE });
    this.pagina.drawText(`$${resultados.precioOptimo.toFixed(2)}`, {
      x: 72,
      y: this.y - 64,
      size: 26,
      font: this.fuenteNegrita,
      color: TEXTO_OSCURO,
    });

    const xGanancia = ANCHO_PAGINA / 2 + 24;
    this.pagina.drawText('Ganancia máxima estimada', { x: xGanancia, y: this.y - 34, size: 11, font: this.fuente, color: TEXTO_TENUE });
    this.pagina.drawText(`$${resultados.gananciaMaxima.toFixed(2)}`, {
      x: xGanancia,
      y: this.y - 64,
      size: 26,
      font: this.fuenteNegrita,
      color: AZUL_CLARO,
    });
    this.y -= 132;

    this.pagina.drawText('Estrategia recomendada', { x: 48, y: this.y, size: 13, font: this.fuenteNegrita, color: AZUL_PRIMARIO });
    this.y -= 22;
    this.y = this.dibujarTexto(resultados.estrategiaSugerida, 48, this.y, 11, TEXTO_OSCURO);
    this.y -= 20;
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
      'Agendá un diagnóstico gratuito de 30 minutos con un especialista de Sinaptek.',
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
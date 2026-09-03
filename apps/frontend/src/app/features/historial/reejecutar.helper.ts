import type { EscenarioResponse } from '@mutual-metrics/shared';

// Rutas de destino para re-ejecutar un escenario, según su tipo. Solo existen
// calculadoras para cuadrática y pricing; un tipo desconocido no tiene destino.
export const RUTAS_RE_EJECUTAR: Readonly<Record<EscenarioResponse['tipo'], string>> = {
  cuadratica: '/cuadratica',
  pricing: '/pricing',
};

// Devuelve la ruta a la calculadora correspondiente al tipo, o null si el tipo
// no es re-ejecutable (no hay calculadora asociada).
export function rutaReEjecutar(tipo: EscenarioResponse['tipo'] | string): string | null {
  return RUTAS_RE_EJECUTAR[tipo as EscenarioResponse['tipo']] ?? null;
}

// Valida que los inputs sean un objeto con al menos una clave, antes de
// navegar. Re-ejecutar con inputs vacíos/ausentes pre-cargaría una calculadora
// en blanco, lo que no constituye una re-ejecución real: se bloquea y se avisa.
export function inputsReEjecutables(inputs: Record<string, unknown> | null | undefined): boolean {
  return (
    inputs != null &&
    typeof inputs === 'object' &&
    !Array.isArray(inputs) &&
    Object.keys(inputs).length > 0
  );
}

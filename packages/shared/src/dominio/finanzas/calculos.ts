/**
 * Lógica matemática para cálculos financieros.
 * Estos cálculos son puros y testeables.
 */

/**
 * Calcula el Interés Simple.
 * @param principal Capital inicial
 * @param tasa Tasa de interés anual (ej. 0.05 para 5%)
 * @param tiempo Tiempo en años
 * @returns Objeto con el interés generado y el monto total
 */
export function calcularInteresSimple(principal: number, tasa: number, tiempo: number) {
  const interes = principal * tasa * tiempo;
  const total = principal + interes;
  return { interes, total };
}

/**
 * Calcula el Interés Compuesto.
 * @param principal Capital inicial
 * @param tasa Tasa de interés anual (ej. 0.05 para 5%)
 * @param tiempo Tiempo en años
 * @param frecuencia Frecuencia de capitalización (ej. 12 para mensual, 1 para anual)
 * @returns Objeto con el interés acumulado y el monto total final
 */
export function calcularInteresCompuesto(principal: number, tasa: number, tiempo: number, frecuencia: number = 1) {
  const total = principal * Math.pow(1 + tasa / frecuencia, frecuencia * tiempo);
  const interes = total - principal;
  return { interes, total };
}

/**
 * Calcula el Retorno sobre la Inversión (ROI).
 * @param inversion Monto invertido
 * @param beneficio Beneficio total obtenido (incluyendo la inversión inicial si es el caso, 
 *                  o solo la ganancia neta. Aquí asumimos ganancia neta para la fórmula estándar).
 * @returns Porcentaje de ROI
 */
export function calcularROI(inversion: number, beneficio: number) {
  if (inversion === 0) return 0;
  return ((beneficio - inversion) / inversion) * 100;
}

/**
 * Calcula el Valor Actual Neto (VAN / NPV).
 * @param tasa Tasa de descuento (ej. 0.1 para 10%)
 * @param inversionInicial Inversión en el periodo 0 (negativo)
 * @param flujos Lista de flujos de caja futuros
 * @returns VAN
 */
export function calcularVAN(tasa: number, inversionInicial: number, flujos: number[]) {
  let van = inversionInicial;
  for (let t = 0; t < flujos.length; t++) {
    van += flujos[t] / Math.pow(1 + tasa, t + 1);
  }
  return van;
}

/**
 * Calcula la Tasa Interna de Retorno (TIR / IRR).
 * Utiliza el método de Newton-Raphson para encontrar la raíz.
 * @param inversionInicial Inversión inicial (negativo)
 * @param flujos Lista de flujos de caja futuros
 * @returns TIR aproximada (ej. 0.15 para 15%)
 */
export function calcularTIR(inversionInicial: number, flujos: number[]) {
  const maxIteraciones = 1000;
  const precision = 0.00001;
  let tasa = 0.1; // Estimación inicial (10%)

  for (let i = 0; i < maxIteraciones; i++) {
    let van = inversionInicial;
    let derivadaVan = 0;

    for (let t = 0; t < flujos.length; t++) {
      const exponente = t + 1;
      const factor = Math.pow(1 + tasa, exponente);
      van += flujos[t] / factor;
      derivadaVan -= (exponente * flujos[t]) / (factor * (1 + tasa));
    }

    const nuevaTasa = tasa - van / derivadaVan;

    if (Math.abs(nuevaTasa - tasa) < precision) {
      return nuevaTasa;
    }

    tasa = nuevaTasa;
  }

  return tasa; // Retorna la mejor aproximación encontrada
}

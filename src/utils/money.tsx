/**
 * money.ts — Helpers de formato numérico/monetario para el módulo de Ventas.
 * Centraliza el redondeo a 2 decimales (evita errores de punto flotante
 * repetidos en cada componente) y el formato "S/ 0.00" consistente en
 * resumen de cuenta, comprobantes, caja e historial.
 */

/** Redondea a 2 decimales evitando artefactos de punto flotante (0.1+0.2). */
export const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/** Formatea un monto como "S/ 0.00". Acepta negativos (para ajustes/descuentos). */
export const formatMoney = (value: number, currency = 'S/'): string => {
  const rounded = round2(value);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}${currency}\u00A0${Math.abs(rounded).toFixed(2)}`;
};

/**
 * Redondeo comercial al S/ 0.10 más cercano (práctica común en cobro en
 * efectivo en Perú para evitar manejar moneda fraccionaria de 1 y 5 céntimos).
 * Devuelve el total redondeado y el ajuste aplicado (puede ser + o -).
 */
export const roundToNearestDime = (total: number): { rounded: number; adjustment: number } => {
  const rounded = round2(Math.round(total * 10) / 10);
  return { rounded, adjustment: round2(rounded - total) };
};

/** Suma segura de montos (evita acumulación de error de punto flotante). */
export const sumMoney = (values: number[]): number => round2(values.reduce((acc, v) => acc + v, 0));
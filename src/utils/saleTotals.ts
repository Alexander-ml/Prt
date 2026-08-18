import type { Tax, Promotion } from '../types';
import { round2, roundToNearestDime } from './money';

/**
 * saleTotals — única fuente de verdad para el cálculo de un cobro:
 * descuento, impuestos, propina y redondeo comercial. La usan tanto la
 * vista previa de SalesPage.tsx como AppContext.processSaleBilling para el
 * cobro real, para que ambos montos nunca puedan desalinearse (antes cada
 * uno repetía la misma fórmula a mano).
 *
 * Corrección central de este refactor: `taxAmount` ahora suma TODOS los
 * impuestos activos de Configuración, no solo el que tenga "IGV" en el
 * nombre. Antes, `taxes.find(t => t.active && t.name.includes('IGV'))`
 * (repetido igual en SalesPage.tsx y AppContext.tsx) hacía que activar
 * "Recargo al Servicio" desde Configuración no cambiara el total de
 * ninguna venta.
 *
 * Nota de diseño: esta función NO se llama `useSaleTotals` ni vive en
 * `src/hooks/`. Es una función pura sin estado ni efectos, y
 * AppContext.processSaleBilling la invoca desde un manejador de evento (al
 * confirmar el cobro), no durante el render — nombrarla como un Hook de
 * React (prefijo `use`) dispararía la regla `react-hooks/rules-of-hooks`
 * que ya usa este proyecto (`eslint-plugin-react-hooks`) sin que la función
 * necesite en ningún momento el ciclo de vida de un hook.
 */

export interface SaleTotalsInput {
  subtotal: number;
  activePromo?: Pick<Promotion, 'discountPercentage'>;
  /** TODOS los impuestos de Configuración (activos e inactivos); esta
   *  función filtra los activos internamente. */
  taxes: Tax[];
  tipAmount: number;
}

export interface SaleTaxBreakdownEntry {
  taxId: string;
  name: string;
  percentage: number;
  amount: number;
}

export interface SaleTotalsResult {
  discountAmount: number;
  /** Suma de TODOS los impuestos activos (IGV + Recargo al Servicio + los
   *  que se activen a futuro desde Configuración). */
  taxAmount: number;
  /** Detalle por impuesto activo, por si a futuro se necesita mostrar cada
   *  línea por separado (ej. en el comprobante). */
  taxBreakdown: SaleTaxBreakdownEntry[];
  roundingAdjustment: number;
  total: number;
}

export function calculateSaleTotals({ subtotal, activePromo, taxes, tipAmount }: SaleTotalsInput): SaleTotalsResult {
  const discountAmount = activePromo ? round2((subtotal * activePromo.discountPercentage) / 100) : 0;
  const base = round2(subtotal - discountAmount);

  const taxBreakdown: SaleTaxBreakdownEntry[] = taxes
    .filter(t => t.active)
    .map(t => ({ taxId: t.id, name: t.name, percentage: t.percentage, amount: round2((base * t.percentage) / 100) }));
  const taxAmount = round2(taxBreakdown.reduce((sum, t) => sum + t.amount, 0));

  // Mismo redondeo comercial al S/ 0.10 más cercano que ya usaba el proyecto.
  const { rounded: total, adjustment: roundingAdjustment } = roundToNearestDime(base + taxAmount + tipAmount);

  return { discountAmount, taxAmount, taxBreakdown, roundingAdjustment, total };
}

/**
 * Porcentaje de IGV a mostrar como etiqueta (ej. "IGV (18%)") en el resumen
 * de cobro y en el comprobante. Es solo para el rótulo — el monto real que
 * se cobra ya no depende de este valor, sino de la suma de `taxBreakdown`
 * en `calculateSaleTotals`. Si no hay ningún impuesto activo llamado "IGV",
 * se conserva el valor por defecto (18%) que ya usaba el proyecto.
 */
export function resolveIgvPercentLabel(taxes: Tax[]): number {
  const activeIgv = taxes.find(t => t.active && t.name.includes('IGV'));
  return activeIgv ? activeIgv.percentage : 18;
}

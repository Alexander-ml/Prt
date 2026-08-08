import type { LedgerEntry, Sale, FinancialSummary } from '../../types';
import type { DropdownOption } from '../common/CustomDropdownSelect';
import { round2, sumMoney } from '../../utils/money';

export type PeriodFilter = 'este_mes' | 'mes_anterior' | 'anio_actual';

export interface PeriodRange {
  from: Date;
  to: Date;
  label: string;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const formatMonthLabel = (d: Date): string => `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

/**
 * Único punto que decide el rango de fechas de un período — reemplaza las
 * opciones fijas ("Julio 2026", "Junio 2026"...) que tenía el <select>
 * original de AccountingPage.tsx, que en realidad no filtraba nada.
 */
export function getPeriodRange(period: PeriodFilter, now: Date = new Date()): PeriodRange {
  const year = now.getFullYear();
  const month = now.getMonth();

  if (period === 'mes_anterior') {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59, 999);
    return { from, to, label: formatMonthLabel(from) };
  }
  if (period === 'anio_actual') {
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31, 23, 59, 59, 999);
    return { from, to, label: `Año ${year}` };
  }
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { from, to, label: formatMonthLabel(from) };
}

/**
 * Rango equivalente inmediatamente anterior al período elegido — se usa
 * para calcular el trend real de Ingresos Totales (reemplaza el "+18%"
 * fijo que tenía el StatCard original).
 */
export function getPreviousPeriodRange(period: PeriodFilter, now: Date = new Date()): PeriodRange {
  if (period === 'mes_anterior') {
    const anchor = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return getPeriodRange('mes_anterior', anchor);
  }
  if (period === 'anio_actual') {
    const anchor = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    return getPeriodRange('anio_actual', anchor);
  }
  return getPeriodRange('mes_anterior', now);
}

export function isDateInRange(dateStr: string, range: PeriodRange): boolean {
  const d = new Date(`${dateStr}T00:00:00`);
  return d >= range.from && d <= range.to;
}

/**
 * Un asiento automático de venta ("Ventas Restobar", generado por
 * processSaleBilling) queda anulado si la venta que lo originó fue
 * anulada en Ventas. El asiento nunca se borra ni se modifica — se
 * preserva el historial real, tal como exige la contabilidad — pero deja
 * de contar en los totales. Mismo criterio que ya usa `validSales` en
 * SalesPage para excluir ventas anuladas de sus propios cálculos.
 */
export function isLedgerEntryVoided(entry: LedgerEntry, sales: Sale[]): boolean {
  if (!entry.reference?.startsWith('ven-')) return false;
  const sale = sales.find(s => s.id === entry.reference);
  return !!sale?.isCancelled;
}

/**
 * Ventas válidas (no anuladas) cuyo asiento automático cae dentro de un
 * rango de fechas — se cruza vía el asiento del Libro Diario en vez de
 * parsear `Sale.closedAt` (que es un string de display en formato
 * es-PE, no ISO), reusando la misma fecha ISO que ya guarda cada asiento.
 */
export function getValidSalesInRange(ledgerEntries: LedgerEntry[], sales: Sale[], range: PeriodRange): Sale[] {
  const idsInRange = new Set(
    ledgerEntries
      .filter(e => e.reference?.startsWith('ven-') && isDateInRange(e.date, range))
      .map(e => e.reference)
  );
  return sales.filter(s => !s.isCancelled && idsInRange.has(s.id));
}

/**
 * Único punto que calcula el resumen financiero de un período — siempre
 * derivado de `ledgerEntries` + `sales`, nunca un estado que haya que
 * mantener sincronizado a mano (ver diagnóstico de Contabilidad, sección
 * 4.2). Anular una venta en Ventas se refleja acá sin ningún cambio
 * adicional en ningún otro punto del código.
 */
export function computeFinancialSummary(
  ledgerEntries: LedgerEntry[],
  sales: Sale[],
  range: PeriodRange
): FinancialSummary {
  const inRange = ledgerEntries.filter(e => isDateInRange(e.date, range));
  const valid = inRange.filter(e => !isLedgerEntryVoided(e, sales));

  const totalRevenue = sumMoney(valid.filter(e => e.type === 'ingreso').map(e => e.amount));
  const totalExpenses = sumMoney(valid.filter(e => e.type === 'egreso').map(e => e.amount));

  const validSales = getValidSalesInRange(ledgerEntries, sales, range);
  const taxCollected = sumMoney(validSales.map(s => s.taxAmount));

  return {
    totalRevenue,
    totalExpenses,
    netProfit: round2(totalRevenue - totalExpenses),
    taxCollected,
  };
}

export const PERIOD_OPTIONS: DropdownOption[] = [
  { value: 'este_mes', label: 'Este Mes', icon: 'bi-calendar-check-fill', colorVariant: 'primary' },
  { value: 'mes_anterior', label: 'Mes Anterior', icon: 'bi-calendar-minus-fill', colorVariant: 'secondary' },
  { value: 'anio_actual', label: 'Año Actual', icon: 'bi-calendar3-range-fill', colorVariant: 'info' },
];
import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { formatMoney } from '../../utils/money';
import {
  getPeriodRange,
  getPreviousPeriodRange,
  computeFinancialSummary,
  type PeriodFilter,
} from './accountingMeta';

interface FinancialKpisRowProps {
  periodFilter: PeriodFilter;
  /** StatCard ya soporta `onClick` — al hacer clic en "Egresos
   *  Registrados", AccountingPage activa el filtro de solo egresos en el
   *  Libro Diario, mismo criterio que "Bajo Stock Mínimo" en Inventario. */
  onExpenseClick: () => void;
}

/**
 * FinancialKpisRow — 4 StatCards (Ingresos Totales, Egresos Registrados,
 * Utilidad Neta Estimada, IGV Recaudado), siempre derivados en vivo de
 * `ledgerEntries` + `sales` para el período elegido — ningún valor se
 * guarda en estado propio, así que una venta anulada en Ventas se refleja
 * acá sin que nadie tenga que "acordarse" de actualizar Contabilidad (ver
 * accountingMeta.ts, computeFinancialSummary).
 */
export const FinancialKpisRow: React.FC<FinancialKpisRowProps> = ({ periodFilter, onExpenseClick }) => {
  const { ledgerEntries, sales } = useApp();

  const currentRange = getPeriodRange(periodFilter);
  const previousRange = getPreviousPeriodRange(periodFilter);
  const summary = computeFinancialSummary(ledgerEntries, sales, currentRange);
  const previousSummary = computeFinancialSummary(ledgerEntries, sales, previousRange);

  // Trend real comparado contra el período anterior — reemplaza el "+18%"
  // fijo que tenía el StatCard original, que no comparaba nada.
  const revenueTrendPct = previousSummary.totalRevenue > 0
    ? Math.round(((summary.totalRevenue - previousSummary.totalRevenue) / previousSummary.totalRevenue) * 100)
    : null;

  const marginPct = summary.totalRevenue > 0
    ? Math.round((summary.netProfit / summary.totalRevenue) * 100)
    : 0;

  return (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 mb-4 stagger-children">
      <div className="col">
        <StatCard
          title="Ingresos Totales"
          value={formatMoney(summary.totalRevenue)}
          subtitle={currentRange.label}
          icon="bi-arrow-down-left-circle-fill"
          colorTheme="emerald"
          trend={revenueTrendPct !== null ? {
            value: `${revenueTrendPct >= 0 ? '+' : ''}${revenueTrendPct}%`,
            positive: revenueTrendPct >= 0,
          } : undefined}
        />
      </div>
      <div className="col">
        <StatCard
          title="Egresos Registrados"
          value={formatMoney(summary.totalExpenses)}
          subtitle="Clic para ver solo egresos del período"
          icon="bi-arrow-up-right-circle-fill"
          colorTheme="rose"
          onClick={onExpenseClick}
        />
      </div>
      <div className="col">
        <StatCard
          title="Utilidad Neta Estimada"
          value={formatMoney(summary.netProfit)}
          subtitle={`Margen neto: ${marginPct}%`}
          icon="bi-graph-up-arrow"
          colorTheme="indigo"
        />
      </div>
      <div className="col">
        <StatCard
          title="IGV Recaudado"
          value={formatMoney(summary.taxCollected)}
          subtitle="Sobre comprobantes válidos del período"
          icon="bi-file-earmark-text-fill"
          colorTheme="amber"
        />
      </div>
    </div>
  );
};
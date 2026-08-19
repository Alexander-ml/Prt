import React from 'react';
import { useApp } from '../../context/AppContext';
import { SectionCard } from '../common/SectionCard';
import { EmptyState } from '../common/EmptyState';
import { formatMoney } from '../../utils/money';
import {
  getPeriodRange,
  computeFinancialSummary,
  isDateInRange,
  isLedgerEntryVoided,
  type PeriodFilter,
} from './accountingMeta';

interface IncomeStatementViewProps {
  periodFilter: PeriodFilter;
}

export const IncomeStatementView: React.FC<IncomeStatementViewProps> = ({ periodFilter }) => {
  const { ledgerEntries, sales } = useApp();
  const range = getPeriodRange(periodFilter);
  const summary = computeFinancialSummary(ledgerEntries, sales, range);

  const inRange = ledgerEntries.filter(e => isDateInRange(e.date, range) && !isLedgerEntryVoided(e, sales));

  const incomeByCategory = inRange
    .filter(e => e.type === 'ingreso')
    .reduce<Record<string, number>>((acc, e) => {
      acc[e.categoryName] = (acc[e.categoryName] ?? 0) + e.amount;
      return acc;
    }, {});

  const expenseByCategory = inRange
    .filter(e => e.type === 'egreso')
    .reduce<Record<string, number>>((acc, e) => {
      acc[e.categoryName] = (acc[e.categoryName] ?? 0) + e.amount;
      return acc;
    }, {});

  const marginPct = summary.totalRevenue > 0
    ? Math.round((summary.netProfit / summary.totalRevenue) * 100)
    : 0;

  if (Object.keys(incomeByCategory).length === 0 && Object.keys(expenseByCategory).length === 0) {
    return (
      <SectionCard icon="bi-file-earmark-bar-graph" title="Estado de Resultados">
        <EmptyState icon="bi-file-earmark" title="Sin datos para el período" description="No hay asientos contables en el período seleccionado." />
      </SectionCard>
    );
  }

  return (
    <SectionCard icon="bi-file-earmark-bar-graph" title="Estado de Resultados" className="mb-4">
      <div className="p-3">
        <div className="text-center mb-4">
          <h6 className="text-muted mb-1">Período: {range.label}</h6>
          <small className="text-muted">Formato de Estado de Resultados por función</small>
        </div>

        <div className="mb-4">
          <h6 className="fw-bold text-success mb-3">
            <i className="bi bi-arrow-down-left-circle me-2"></i>INGRESOS OPERATIVOS
          </h6>
          {Object.entries(incomeByCategory).map(([cat, amount]) => (
            <div key={cat} className="d-flex justify-content-between py-1 border-bottom" style={{ borderColor: 'var(--border-color) !important' }}>
              <span style={{ fontSize: '0.85rem', paddingLeft: 20 }}>{cat}</span>
              <span className="fw-semibold text-success">{formatMoney(amount)}</span>
            </div>
          ))}
          <div className="d-flex justify-content-between py-2 fw-bold" style={{ borderTop: '2px solid var(--color-emerald)' }}>
            <span>Total Ingresos</span>
            <span className="text-success">{formatMoney(summary.totalRevenue)}</span>
          </div>
        </div>

        <div className="mb-4">
          <h6 className="fw-bold text-danger mb-3">
            <i className="bi bi-arrow-up-right-circle me-2"></i>EGRESOS Y GASTOS
          </h6>
          {Object.entries(expenseByCategory).map(([cat, amount]) => (
            <div key={cat} className="d-flex justify-content-between py-1 border-bottom" style={{ borderColor: 'var(--border-color) !important' }}>
              <span style={{ fontSize: '0.85rem', paddingLeft: 20 }}>{cat}</span>
              <span className="fw-semibold text-danger">{formatMoney(amount)}</span>
            </div>
          ))}
          <div className="d-flex justify-content-between py-2 fw-bold" style={{ borderTop: '2px solid var(--color-rose)' }}>
            <span>Total Egresos</span>
            <span className="text-danger">{formatMoney(summary.totalExpenses)}</span>
          </div>
        </div>

        <div className="p-3 rounded-3" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(99,102,241,0.08))' }}>
          <div className="d-flex justify-content-between mb-2">
            <span className="fw-bold" style={{ fontSize: '1.05rem' }}>
              <i className="bi bi-graph-up-arrow me-2"></i>UTILIDAD NETA
            </span>
            <span className="fw-bold" style={{ fontSize: '1.1rem', color: summary.netProfit >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
              {formatMoney(summary.netProfit)}
            </span>
          </div>
          <div className="d-flex justify-content-between">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Margen Neto</span>
            <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>{marginPct}%</span>
          </div>
          <div className="d-flex justify-content-between mt-1">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>IGV Recaudado</span>
            <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>{formatMoney(summary.taxCollected)}</span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

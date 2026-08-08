import React from 'react';
import type { LedgerEntry, Sale } from '../../types';
import { SectionCard } from '../common/SectionCard';
import { EmptyState } from '../common/EmptyState';
import { formatMoney } from '../../utils/money';
import { isLedgerEntryVoided, isDateInRange, type PeriodRange } from './accountingMeta';

interface ExpenseBreakdownCardProps {
  ledgerEntries: LedgerEntry[];
  sales: Sale[];
  range: PeriodRange;
}

/**
 * ExpenseBreakdownCard — Egresos del período agrupados por categoría
 * contable real, de mayor a menor. Responde "¿en qué se me está yendo la
 * plata?", que antes no tenía ninguna respuesta visual en el módulo (ver
 * diagnóstico de Contabilidad, Desventaja #10). Solo es posible gracias a
 * que la categoría dejó de ser un <input> de texto libre.
 */
export const ExpenseBreakdownCard: React.FC<ExpenseBreakdownCardProps> = ({ ledgerEntries, sales, range }) => {
  const expenses = ledgerEntries.filter(
    e => e.type === 'egreso' && isDateInRange(e.date, range) && !isLedgerEntryVoided(e, sales)
  );
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.categoryName] = (acc[e.categoryName] ?? 0) + e.amount;
    return acc;
  }, {});
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <SectionCard icon="bi-pie-chart-fill" title="Egresos por Categoría" className="h-100">
      {sorted.length === 0 ? (
        <EmptyState icon="bi-pie-chart" title="Sin egresos en el período" />
      ) : (
        <div className="d-flex flex-column gap-3">
          {sorted.map(([categoryName, amount]) => {
            const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
            return (
              <div key={categoryName}>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-truncate" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {categoryName}
                  </span>
                  <span className="flex-shrink-0 ms-2" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-rose)' }}>
                    {formatMoney(amount)}{' '}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({pct}%)</span>
                  </span>
                </div>
                <div className="progress" style={{ height: 8, borderRadius: 99 }}>
                  <div className="progress-bar bg-danger" style={{ width: `${pct}%`, borderRadius: 99 }}></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};
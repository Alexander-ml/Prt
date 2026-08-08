import React from 'react';
import type { LedgerEntry, Sale, PaymentMethod } from '../../types';
import { SectionCard } from '../common/SectionCard';
import { EmptyState } from '../common/EmptyState';
import { formatMoney } from '../../utils/money';
import { CATEGORY_LABELS, CATEGORY_COLOR_VARIANTS } from '../../utils/payments';
import { getValidSalesInRange, type PeriodRange } from './accountingMeta';

interface PaymentMethodBreakdownCardProps {
  ledgerEntries: LedgerEntry[];
  sales: Sale[];
  range: PeriodRange;
}

// Traduce las mismas variantes de CATEGORY_COLOR_VARIANTS (utils/payments.tsx,
// el catálogo que ya usa HistoryView) a un color de barra sólido — mismo
// criterio de paleta que ya aplica Badge.tsx internamente, no una paleta nueva.
const BAR_COLOR: Record<string, string> = {
  success: 'var(--color-emerald)',
  primary: 'var(--color-brand)',
  violet: 'var(--color-violet)',
  sky: 'var(--color-sky)',
  amber: 'var(--color-amber)',
  secondary: '#64748b',
};

/**
 * PaymentMethodBreakdownCard — Ingresos del período agrupados por forma de
 * pago. Cruza Contabilidad con Cobro reutilizando el mismo catálogo de
 * `HistoryView` (utils/payments.tsx), sin inventar uno nuevo. Resuelve la
 * Desventaja #9 del diagnóstico: antes no había forma de responder cuánto
 * de lo facturado entró en efectivo vs. billetera digital desde este módulo.
 */
export const PaymentMethodBreakdownCard: React.FC<PaymentMethodBreakdownCardProps> = ({ ledgerEntries, sales, range }) => {
  const validSales = getValidSalesInRange(ledgerEntries, sales, range);
  const totalRevenue = validSales.reduce((sum, s) => sum + s.total, 0);

  const byMethod = validSales.reduce<Partial<Record<PaymentMethod, number>>>((acc, s) => {
    acc[s.paymentMethod] = (acc[s.paymentMethod] ?? 0) + s.total;
    return acc;
  }, {});
  const sorted = (Object.entries(byMethod) as [PaymentMethod, number][]).sort((a, b) => b[1] - a[1]);

  return (
    <SectionCard icon="bi-wallet2" title="Ingresos por Forma de Pago" className="h-100">
      {sorted.length === 0 ? (
        <EmptyState icon="bi-wallet2" title="Sin cobros en el período" />
      ) : (
        <div className="d-flex flex-column gap-3">
          {sorted.map(([method, amount]) => {
            const pct = totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0;
            const colorKey = CATEGORY_COLOR_VARIANTS[method];
            return (
              <div key={method}>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-truncate" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {CATEGORY_LABELS[method]}
                  </span>
                  <span className="flex-shrink-0 ms-2" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-emerald)' }}>
                    {formatMoney(amount)}{' '}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({pct}%)</span>
                  </span>
                </div>
                <div className="progress" style={{ height: 8, borderRadius: 99 }}>
                  <div
                    className="progress-bar"
                    style={{ width: `${pct}%`, borderRadius: 99, background: BAR_COLOR[colorKey] ?? '#64748b' }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};
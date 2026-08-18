import React from 'react';
import type { FinancialSummary } from '../../types';
import { SectionCard } from '../common/SectionCard';
import { formatMoney } from '../../utils/money';

interface FinancialDistributionCardProps {
  summary: FinancialSummary;
  marginPct: number;
}

/**
 * FinancialDistributionCard — Barras Ingresos/Egresos/Utilidad. Mismo
 * visual que tenía AccountingPage.tsx originalmente (se preserva tal
 * cual, ver diagnóstico sección 1: "comunica bien la relación entre los
 * tres montos"), ahora alimentado por valores siempre derivados en vez
 * de un estado mutado a mano.
 */
export const FinancialDistributionCard: React.FC<FinancialDistributionCardProps> = ({ summary, marginPct }) => {
  const expensePct = summary.totalRevenue > 0
    ? Math.min(100, (summary.totalExpenses / summary.totalRevenue) * 100)
    : 0;

  return (
    <SectionCard icon="bi-bar-chart-fill" title="Distribución Financiera del Período" className="mb-4">
      <div className="d-flex flex-column gap-3">
        <div>
          <div className="d-flex justify-content-between mb-1">
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-emerald)' }}>
              <i className="bi bi-arrow-down-left me-1"></i>Ingresos Operativos
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatMoney(summary.totalRevenue)}
            </span>
          </div>
          <div className="progress" style={{ height: 10, borderRadius: 99 }}>
            <div className="progress-bar bg-success" style={{ width: '100%', borderRadius: 99 }}></div>
          </div>
        </div>
        <div>
          <div className="d-flex justify-content-between mb-1">
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-rose)' }}>
              <i className="bi bi-arrow-up-right me-1"></i>Egresos y Gastos
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatMoney(summary.totalExpenses)}
            </span>
          </div>
          <div className="progress" style={{ height: 10, borderRadius: 99 }}>
            <div
              className="progress-bar bg-danger"
              style={{ width: `${expensePct}%`, borderRadius: 99 }}
            ></div>
          </div>
        </div>
        <div>
          <div className="d-flex justify-content-between mb-1">
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-brand)' }}>
              <i className="bi bi-stars me-1"></i>Utilidad Neta
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatMoney(summary.netProfit)}
            </span>
          </div>
          <div className="progress" style={{ height: 10, borderRadius: 99 }}>
            <div
              className="progress-bar"
              style={{
                width: `${Math.max(0, Math.min(100, marginPct))}%`,
                background: 'linear-gradient(90deg, #f97316, #fb923c)',
                borderRadius: 99,
                transition: 'width 0.5s ease',
              }}
            ></div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};
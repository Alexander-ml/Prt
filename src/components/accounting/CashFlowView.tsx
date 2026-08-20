import React from 'react';
import { useApp } from '../../context/AppContext';
import { SectionCard } from '../common/SectionCard';
import { EmptyState } from '../common/EmptyState';
import { formatMoney } from '../../utils/money';
import {
  getPeriodRange,
  isDateInRange,
  isLedgerEntryVoided,
  type PeriodFilter,
} from './accountingMeta';

interface CashFlowViewProps {
  periodFilter: PeriodFilter;
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({ periodFilter }) => {
  const { ledgerEntries, sales, cashSessionHistory } = useApp();
  const range = getPeriodRange(periodFilter);

  const inRange = ledgerEntries.filter(e => isDateInRange(e.date, range) && !isLedgerEntryVoided(e, sales));

  const inflowsByCategory = inRange
    .filter(e => e.type === 'ingreso')
    .reduce<{ source: string; amount: number }[]>((acc, e) => {
      const existing = acc.find(a => a.source === e.categoryName);
      if (existing) existing.amount += e.amount;
      else acc.push({ source: e.categoryName, amount: e.amount });
      return acc;
    }, []);

  const outflowsByCategory = inRange
    .filter(e => e.type === 'egreso')
    .reduce<{ source: string; amount: number }[]>((acc, e) => {
      const existing = acc.find(a => a.source === e.categoryName);
      if (existing) existing.amount += e.amount;
      else acc.push({ source: e.categoryName, amount: e.amount });
      return acc;
    }, []);

  const closedSessionsInRange = cashSessionHistory.filter(s =>
    s.closedAt && isDateInRange(s.closedAt.split(' ')[0], range)
  );

  const totalInflows = inflowsByCategory.reduce((s, i) => s + i.amount, 0);
  const totalOutflows = outflowsByCategory.reduce((s, o) => s + o.amount, 0);
  const netCashFlow = totalInflows - totalOutflows;

  if (inflowsByCategory.length === 0 && outflowsByCategory.length === 0) {
    return (
      <SectionCard icon="bi-cash-stack" title="Flujo de Efectivo">
        <EmptyState icon="bi-cash" title="Sin datos para el período" description="No hay movimientos contables en el período seleccionado." />
      </SectionCard>
    );
  }

  return (
    <SectionCard icon="bi-cash-stack" title="Flujo de Efectivo" className="mb-4">
      <div className="p-3">
        <div className="text-center mb-4">
          <h6 className="text-muted mb-1">Período: {range.label}</h6>
          <small className="text-muted">Resumen de entradas y salidas de efectivo</small>
        </div>

        {closedSessionsInRange.length > 0 && (
          <div className="mb-4 p-3 rounded-3" style={{ background: 'rgba(99,102,241,0.06)' }}>
            <h6 className="fw-bold text-primary mb-2">
              <i className="bi bi-calendar-check me-2"></i>Sesiones de Caja Cerradas ({closedSessionsInRange.length})
            </h6>
            {closedSessionsInRange.map(s => (
              <div key={s.id} className="d-flex justify-content-between py-1" style={{ fontSize: '0.85rem' }}>
                <span className="text-muted">{s.closedAt} — Arqueo</span>
                <span className={!s.difference ? 'text-success' : 'text-warning'}>
                  {!s.difference ? 'Cuadra' : `${s.difference > 0 ? 'Sobrante' : 'Faltante'}: ${formatMoney(Math.abs(s.difference))}`}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ENTRADAS</div>
              <div className="fw-bold text-success" style={{ fontSize: '1.3rem' }}>{formatMoney(totalInflows)}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(239,68,68,0.08)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>SALIDAS</div>
              <div className="fw-bold text-danger" style={{ fontSize: '1.3rem' }}>{formatMoney(totalOutflows)}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 rounded-3 text-center" style={{ background: netCashFlow >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>FLUJO NETO</div>
              <div className="fw-bold" style={{ fontSize: '1.3rem', color: netCashFlow >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                {formatMoney(netCashFlow)}
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <h6 className="fw-bold text-success mb-3">
              <i className="bi bi-arrow-down-circle me-2"></i>Entradas por Categoría
            </h6>
            {inflowsByCategory.map(item => {
              const pct = totalInflows > 0 ? Math.round((item.amount / totalInflows) * 100) : 0;
              return (
                <div key={item.source} className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.source}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-emerald)' }}>
                      {formatMoney(item.amount)} <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
                    </span>
                  </div>
                  <div className="progress" style={{ height: 6, borderRadius: 99 }}>
                    <div className="progress-bar bg-success" style={{ width: `${pct}%`, borderRadius: 99 }}></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="col-md-6">
            <h6 className="fw-bold text-danger mb-3">
              <i className="bi bi-arrow-up-circle me-2"></i>Salidas por Categoría
            </h6>
            {outflowsByCategory.map(item => {
              const pct = totalOutflows > 0 ? Math.round((item.amount / totalOutflows) * 100) : 0;
              return (
                <div key={item.source} className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.source}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-rose)' }}>
                      {formatMoney(item.amount)} <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
                    </span>
                  </div>
                  <div className="progress" style={{ height: 6, borderRadius: 99 }}>
                    <div className="progress-bar bg-danger" style={{ width: `${pct}%`, borderRadius: 99 }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

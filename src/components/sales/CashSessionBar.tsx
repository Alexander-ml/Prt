import React from 'react';
import type { CashSession, PaymentMethod } from '../../types';
import { formatMoney } from '../../utils/money';
import { getPaymentMethodMeta, CATEGORY_LABELS } from '../../utils/payments';

interface CashSessionBarProps {
  cashSession: CashSession | null;
  /** 'gate' — barra compacta que bloquea el cobro si la caja está cerrada (BillingView).
   *  'summary' — panel ampliado con desglose por método (HistoryView). */
  variant?: 'gate' | 'summary';
  onOpenClick: () => void;
  onCloseClick: () => void;
  onMovementClick: () => void;
}

/**
 * CashSessionBar — Estado de Caja (RF-56 v2, punto #16 del análisis UX).
 *
 * Antes no existía el concepto de caja: se podía cobrar sin haber abierto
 * turno y sin poder hacer un arqueo al final. Este componente es el punto
 * único de apertura/cierre de caja y, en el cobro, actúa como compuerta:
 * si no hay una caja abierta, no se puede confirmar ningún cobro.
 */
export const CashSessionBar: React.FC<CashSessionBarProps> = ({
  cashSession,
  variant = 'gate',
  onOpenClick,
  onCloseClick,
  onMovementClick,
}) => {
  const isOpen = !!cashSession && cashSession.status === 'abierta';

  const breakdown: Record<PaymentMethod, number> = {
    efectivo: 0, tarjeta: 0, billetera: 0, transferencia: 0, otro: 0, mixto: 0,
  };
  if (isOpen) {
    cashSession!.movements.forEach(m => {
      if ((m.type === 'venta_efectivo' || m.type === 'venta_no_efectivo') && m.method) {
        breakdown[getPaymentMethodMeta(m.method).category] += m.amount;
      }
    });
  }
  const totalVentasTurno = Object.values(breakdown).reduce((a, b) => a + b, 0);

  if (!isOpen) {
    return (
      <div
        className="p-3 rounded-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4"
        style={{ background: 'var(--color-rose-bg)', border: '1px solid #fca5a5' }}
      >
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-lock-fill" style={{ fontSize: '1.3rem', color: 'var(--color-rose-text)' }}></i>
          <div>
            <div className="fw-bold" style={{ color: 'var(--color-rose-text)', fontSize: '0.9rem' }}>Caja Cerrada</div>
            <small style={{ color: 'var(--color-rose-text)', opacity: 0.85 }}>
              Debe abrir un turno de caja antes de poder cobrar cualquier mesa.
            </small>
          </div>
        </div>
        <button type="button" className="btn-brand btn fw-semibold flex-shrink-0" style={{ borderRadius: 8 }} onClick={onOpenClick}>
          <i className="bi bi-unlock-fill me-1"></i> Abrir Caja
        </button>
      </div>
    );
  }

  return (
    <div
      className="p-3 rounded-3 mb-4"
      style={{ background: 'var(--color-emerald-bg)', border: '1px solid #6ee7b7' }}
    >
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2 min-w-0">
          <i className="bi bi-unlock-fill flex-shrink-0" style={{ fontSize: '1.3rem', color: 'var(--color-emerald-text)' }}></i>
          <div className="min-w-0">
            <div className="fw-bold" style={{ color: 'var(--color-emerald-text)', fontSize: '0.9rem' }}>
              Caja Abierta <span className="fw-normal" style={{ opacity: 0.75, fontSize: '0.78rem' }}>· {cashSession!.openedBy}</span>
            </div>
            <small style={{ color: 'var(--color-emerald-text)', opacity: 0.85 }}>
              Desde {cashSession!.openedAt} · Fondo inicial {formatMoney(cashSession!.initialAmount)}
            </small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3 flex-shrink-0">
          <div className="text-sm-end">
            <div style={{ fontSize: '0.7rem', color: 'var(--color-emerald-text)', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase' }}>
              Efectivo Esperado
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-emerald-text)' }}>
              {formatMoney(cashSession!.expectedCash)}
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm fw-semibold bg-white"
              style={{ borderRadius: 8, minHeight: 36 }}
              onClick={onMovementClick}
              title="Registrar ingreso o retiro manual de efectivo"
            >
              <i className="bi bi-arrow-left-right"></i>
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm fw-semibold bg-white"
              style={{ borderRadius: 8, minHeight: 36 }}
              onClick={onCloseClick}
            >
              <i className="bi bi-lock-fill me-1"></i> Cerrar Caja
            </button>
          </div>
        </div>
      </div>

      {variant === 'summary' && totalVentasTurno > 0 && (
        <div className="d-flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: '1px dashed #6ee7b7' }}>
          {(Object.keys(breakdown) as PaymentMethod[])
            .filter(cat => cat !== 'mixto' && breakdown[cat] > 0)
            .map(cat => (
              <div
                key={cat}
                className="px-3 py-2 rounded-3 bg-white flex-fill"
                style={{ minWidth: 130, border: '1px solid #d1fae5' }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {CATEGORY_LABELS[cat]}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatMoney(breakdown[cat])}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
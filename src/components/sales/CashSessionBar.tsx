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
      <div className="p-3 rounded-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4 cash-session-bar-closed">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-lock-fill cash-session-bar-icon" aria-hidden="true"></i>
          <div>
            <div className="cash-session-bar-title">Caja Cerrada</div>
            <small className="cash-session-bar-subtitle">
              Debe abrir un turno de caja antes de poder cobrar cualquier mesa.
            </small>
          </div>
        </div>
        <button type="button" className="btn-brand btn fw-semibold flex-shrink-0 rounded-3" onClick={onOpenClick}>
          <i className="bi bi-unlock-fill me-1"></i> Abrir Caja
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-3 mb-4 cash-session-bar-open">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2 min-w-0">
          <i className="bi bi-unlock-fill flex-shrink-0 cash-session-bar-icon" aria-hidden="true"></i>
          <div className="min-w-0">
            <div className="cash-session-bar-title">
              Caja Abierta <span className="cash-session-bar-title-meta">· {cashSession!.openedBy}</span>
            </div>
            <small className="cash-session-bar-subtitle">
              Desde {cashSession!.openedAt} · Fondo inicial {formatMoney(cashSession!.initialAmount)}
            </small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3 flex-shrink-0">
          <div className="text-sm-end">
            <div className="cash-session-bar-metric-label">
              Efectivo Esperado
            </div>
            <div className="cash-session-bar-metric-value">
              {formatMoney(cashSession!.expectedCash)}
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm fw-semibold bg-white rounded-3 cash-session-bar-btn"
              onClick={onMovementClick}
              title="Registrar ingreso o retiro manual de efectivo"
            >
              <i className="bi bi-arrow-left-right"></i>
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm fw-semibold bg-white rounded-3 cash-session-bar-btn"
              onClick={onCloseClick}
            >
              <i className="bi bi-lock-fill me-1"></i> Cerrar Caja
            </button>
          </div>
        </div>
      </div>

      {variant === 'summary' && totalVentasTurno > 0 && (
        <div className="d-flex flex-wrap gap-2 mt-3 pt-3 cash-session-bar-breakdown">
          {(Object.keys(breakdown) as PaymentMethod[])
            .filter(cat => cat !== 'mixto' && breakdown[cat] > 0)
            .map(cat => (
              <div
                key={cat}
                className="px-3 py-2 rounded-3 bg-white flex-fill cash-session-bar-breakdown-chip"
              >
                <div className="cash-session-bar-breakdown-label">
                  {CATEGORY_LABELS[cat]}
                </div>
                <div className="cash-session-bar-breakdown-value">
                  {formatMoney(breakdown[cat])}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

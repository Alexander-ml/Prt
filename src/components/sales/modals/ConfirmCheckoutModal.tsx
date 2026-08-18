import React from 'react';
import type { Order, TipoComprobante, PaymentSplitEntry, CashPaymentDetail } from '../../../types';
import { Modal } from '../../common/Modal';
import { Badge } from '../../common/Badge';
import { formatMoney } from '../../../utils/money';
import { getPaymentMethodMeta } from '../../../utils/payments';
import { COMPROBANTE_LABELS } from './salesModalsShared';

/* ─────────────────────────────────────────────────────────────
   ConfirmCheckoutModal — Confirmación previa al cobro (punto #20
   del análisis UX). Última pantalla antes de mover dinero de
   verdad: mesa, comprobante, cliente, desglose de pago y vuelto.
   ───────────────────────────────────────────────────────────── */
interface ConfirmCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: Order | undefined;
  comprobanteTipo: TipoComprobante;
  clienteLabel?: string;
  totalAmount: number;
  paymentBreakdown: PaymentSplitEntry[];
  cashDetail?: CashPaymentDetail;
}

export const ConfirmCheckoutModal: React.FC<ConfirmCheckoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  order,
  comprobanteTipo,
  clienteLabel,
  totalAmount,
  paymentBreakdown,
  cashDetail,
}) => {
  if (!isOpen || !order) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Cobro" size="sm">
      <div className="d-flex flex-column gap-3 mb-4">
        <div className="d-flex justify-content-between">
          <span style={{ color: 'var(--text-muted)' }}>Mesa</span>
          <span className="fw-bold">#{order.tableNumber} — {order.areaName}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span style={{ color: 'var(--text-muted)' }}>Comprobante</span>
          <Badge status={COMPROBANTE_LABELS[comprobanteTipo].toUpperCase()} variant="primary" />
        </div>
        {clienteLabel && (
          <div className="d-flex justify-content-between">
            <span style={{ color: 'var(--text-muted)' }}>Cliente</span>
            <span className="fw-semibold text-end" style={{ maxWidth: 220 }}>{clienteLabel}</span>
          </div>
        )}
        <div className="pt-2" style={{ borderTop: '1px dashed var(--border-color)' }}>
          {paymentBreakdown.map(p => (
            <div key={p.id} className="d-flex justify-content-between" style={{ fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                <i className={`bi ${getPaymentMethodMeta(p.method).icon} me-1`}></i>
                {getPaymentMethodMeta(p.method).label}
              </span>
              <span className="fw-semibold">{formatMoney(p.amount)}</span>
            </div>
          ))}
        </div>
        {cashDetail && (
          <div className="d-flex justify-content-between" style={{ fontSize: '0.85rem', color: 'var(--color-emerald-text)' }}>
            <span className="fw-semibold"><i className="bi bi-cash-coin me-1"></i>Vuelto</span>
            <span className="fw-bold">{formatMoney(cashDetail.changeGiven)}</span>
          </div>
        )}
        <div className="d-flex align-items-baseline justify-content-between pt-2" style={{ borderTop: '2px solid var(--border-color)' }}>
          <span style={{ fontWeight: 800 }}>TOTAL</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-brand)' }}>{formatMoney(totalAmount)}</span>
        </div>
      </div>
      <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>
          Volver
        </button>
        <button
          type="button"
          className="btn fw-bold"
          style={{ borderRadius: 8, background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none' }}
          onClick={() => { onConfirm(); onClose(); }}
        >
          <i className="bi bi-check-circle-fill me-2"></i>Confirmar y Cobrar
        </button>
      </div>
    </Modal>
  );
};

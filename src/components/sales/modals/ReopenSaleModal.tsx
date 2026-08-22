import React, { useState, useEffect } from 'react';
import type {
  Sale,
  Cliente,
  TipoComprobante,
  PaymentMethodType,
  PaymentSplitEntry,
  CashPaymentDetail,
  UpdateSalePaymentParams,
} from '../../../types';
import { Modal } from '../../common/Modal';
import { formatMoney, round2 } from '../../../utils/money';
import { PAYMENT_METHODS } from '../../../utils/payments';
import { COMPROBANTE_LABELS } from './salesModalsShared';

/* ─────────────────────────────────────────────────────────────
   ReopenSaleModal — Corrección de pago/comprobante de una venta
   ya cerrada, con motivo obligatorio (RF-61, punto #19 del
   análisis UX). No reemplaza una nota de crédito formal ante
   SUNAT para Boleta/Factura ya emitidas.
   ───────────────────────────────────────────────────────────── */
interface ReopenSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  clientes: Cliente[];
  onConfirm: (saleId: string, params: UpdateSalePaymentParams) => void;
}

export const ReopenSaleModal: React.FC<ReopenSaleModalProps> = ({ isOpen, onClose, sale, clientes, onConfirm }) => {
  const [comprobanteTipo, setComprobanteTipo] = useState<TipoComprobante>('boleta');
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('efectivo');
  const [cashReceivedInput, setCashReceivedInput] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen && sale) {
      setComprobanteTipo(sale.comprobanteTipo);
      setSelectedClienteId(sale.cliente?.id ?? '');
      setSelectedMethod(sale.paymentBreakdown[0]?.method ?? 'efectivo');
      setCashReceivedInput('');
      setReason('');
    }
  }, [isOpen, sale]);

  if (!sale) return null;

  const requiresCliente = comprobanteTipo === 'factura';
  const clienteObj = clientes.find(c => c.id === selectedClienteId);
  const isValid = reason.trim().length > 0 && (!requiresCliente || (!!clienteObj && clienteObj.tipoDocumento === 'RUC'));

  const handleConfirm = () => {
    if (!isValid) return;
    const paymentBreakdown: PaymentSplitEntry[] = [{ id: `pg-fix-${Date.now()}`, method: selectedMethod, amount: sale.total }];
    const cashReceived = parseFloat(cashReceivedInput);
    const cashDetail: CashPaymentDetail | undefined =
      selectedMethod === 'efectivo'
        ? { amountReceived: !isNaN(cashReceived) ? cashReceived : sale.total, changeGiven: round2(Math.max(0, (!isNaN(cashReceived) ? cashReceived : sale.total) - sale.total)) }
        : undefined;
    onConfirm(sale.id, {
      comprobanteTipo,
      cliente: comprobanteTipo === 'ticket' ? undefined : clienteObj,
      paymentBreakdown,
      cashDetail,
      reason: reason.trim(),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Corregir Venta ${sale.serie}-${sale.correlativo}`} size="md">
      <div className="p-2 rounded-3 mb-3 d-flex align-items-center gap-2 payment-pending-warning">
        <i className="bi bi-info-circle-fill"></i>
        <small>
          Esto corrige el comprobante o la forma de pago de una venta ya cobrada. El total ({formatMoney(sale.total)}) no cambia. No emite una nota de crédito ante SUNAT.
        </small>
      </div>

      <div className="mb-3">
        <label className="form-label">Tipo de Comprobante</label>
        <div className="d-flex gap-2">
          {(['ticket', 'boleta', 'factura'] as TipoComprobante[]).map(t => (
            <button
              key={t}
              type="button"
              className={`btn flex-fill fw-semibold rounded-3 modal-toggle-btn ${comprobanteTipo === t ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
              onClick={() => setComprobanteTipo(t)}
            >
              {COMPROBANTE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {comprobanteTipo !== 'ticket' && (
        <div className="mb-3">
          <label className="form-label" htmlFor="reopenCliente">Cliente {requiresCliente && <span className="text-danger">*</span>}</label>
          <select
            id="reopenCliente"
            className="form-select"
            value={selectedClienteId}
            onChange={e => setSelectedClienteId(e.target.value)}
          >
            <option value="">Consumidor Final</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.tipoDocumento} {c.numeroDocumento} — {c.nombreORazonSocial}</option>
            ))}
          </select>
          {requiresCliente && !clienteObj && (
            <small className="d-block mt-1 text-danger text-size-sm">Una factura requiere un cliente con RUC.</small>
          )}
        </div>
      )}

      <div className="mb-3">
        <label className="form-label" htmlFor="reopenMetodo">Forma de Pago Correcta</label>
        <select
          id="reopenMetodo"
          className="form-select"
          value={selectedMethod}
          onChange={e => setSelectedMethod(e.target.value as PaymentMethodType)}
        >
          {PAYMENT_METHODS.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      {selectedMethod === 'efectivo' && (
        <div className="mb-3">
          <label className="form-label" htmlFor="reopenRecibido">Monto Recibido en Efectivo</label>
          <div className="input-group">
            <span className="input-group-text">S/</span>
            <input
              id="reopenRecibido"
              type="number"
              min={0}
              step="0.10"
              className="form-control"
              placeholder={sale.total.toFixed(2)}
              value={cashReceivedInput}
              onChange={e => setCashReceivedInput(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="mb-3">
        <label className="form-label" htmlFor="reopenMotivo">Motivo de la Corrección <span className="text-danger">*</span></label>
        <textarea
          id="reopenMotivo"
          className="form-control rounded-3"
          rows={2}
          placeholder="Ej. El cliente indicó que pagó con Visa, no en efectivo"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
      </div>

      <div className="d-flex justify-content-end gap-2 pt-2 modal-footer-divider">
        <button type="button" className="btn btn-outline-secondary rounded-3" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="btn-brand btn fw-semibold rounded-3" disabled={!isValid} onClick={handleConfirm}>
          <i className="bi bi-arrow-repeat me-1"></i>Guardar Corrección
        </button>
      </div>
    </Modal>
  );
};

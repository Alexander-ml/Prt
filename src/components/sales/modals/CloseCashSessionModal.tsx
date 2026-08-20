import React, { useState, useEffect } from 'react';
import type { CashSession } from '../../../types';
import { Modal } from '../../common/Modal';
import { formatMoney, round2 } from '../../../utils/money';

/* ─────────────────────────────────────────────────────────────
   CloseCashSessionModal — Cierre de turno y arqueo (RF-56 v2,
   punto #16 del análisis UX).
   ───────────────────────────────────────────────────────────── */
interface CloseCashSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashSession: CashSession | null;
  closedByLabel: string;
  onConfirm: (countedCash: number) => void;
}

export const CloseCashSessionModal: React.FC<CloseCashSessionModalProps> = ({ isOpen, onClose, cashSession, closedByLabel, onConfirm }) => {
  const [countedInput, setCountedInput] = useState('');

  useEffect(() => {
    if (isOpen) setCountedInput('');
  }, [isOpen]);

  if (!cashSession) return null;

  const counted = parseFloat(countedInput);
  const hasValue = !isNaN(counted);
  const difference = hasValue ? round2(counted - cashSession.expectedCash) : 0;
  const isValid = hasValue && counted >= 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cerrar Caja y Hacer Arqueo" size="sm">
      <div className="p-3 rounded-3 mb-3 d-flex justify-content-between align-items-center" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border-color)' }}>
        <span className="fw-semibold" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Efectivo esperado en caja</span>
        <span className="fw-bold" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{formatMoney(cashSession.expectedCash)}</span>
      </div>
      <div className="mb-3">
        <label className="form-label fw-bold" htmlFor="efectivoContado">Efectivo Contado Físicamente</label>
        <div className="input-group">
          <span className="input-group-text">S/</span>
          <input
            id="efectivoContado"
            type="number"
            min={0}
            step="0.10"
            className="form-control"
            placeholder="0.00"
            autoFocus
            value={countedInput}
            onChange={e => setCountedInput(e.target.value)}
          />
        </div>
      </div>
      {hasValue && (
        <div
          className="p-2 rounded-3 d-flex justify-content-between align-items-center mb-3"
          style={{
            background: difference === 0 ? 'var(--color-emerald-bg)' : 'var(--color-rose-bg)',
            border: `1px solid ${difference === 0 ? '#6ee7b7' : '#fca5a5'}`,
          }}
        >
          <span className="fw-semibold" style={{ fontSize: '0.82rem', color: difference === 0 ? 'var(--color-emerald-text)' : 'var(--color-rose-text)' }}>
            {difference === 0 ? 'Cuadra exacto' : difference > 0 ? 'Sobrante de caja' : 'Faltante de caja'}
          </span>
          <span className="fw-bold" style={{ color: difference === 0 ? 'var(--color-emerald-text)' : 'var(--color-rose-text)' }}>
            {difference === 0 ? formatMoney(0) : formatMoney(Math.abs(difference))}
          </span>
        </div>
      )}
      <small className="d-block mb-3" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
        <i className="bi bi-person-badge me-1"></i>Cierre a nombre de: <strong>{closedByLabel}</strong>
      </small>
      <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-danger fw-semibold"
          style={{ borderRadius: 8 }}
          disabled={!isValid}
          onClick={() => { if (isValid) { onConfirm(round2(counted)); onClose(); } }}
        >
          <i className="bi bi-lock-fill me-1"></i>Cerrar Caja
        </button>
      </div>
    </Modal>
  );
};

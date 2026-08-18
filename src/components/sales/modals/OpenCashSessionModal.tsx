import React, { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { round2 } from '../../../utils/money';

/* ─────────────────────────────────────────────────────────────
   OpenCashSessionModal — Ciclo de caja (RF-56 v2, punto #16 del
   análisis UX).
   ───────────────────────────────────────────────────────────── */
interface OpenCashSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  openedByLabel: string;
  onConfirm: (initialAmount: number) => void;
}

export const OpenCashSessionModal: React.FC<OpenCashSessionModalProps> = ({ isOpen, onClose, openedByLabel, onConfirm }) => {
  const [amountInput, setAmountInput] = useState('');

  useEffect(() => {
    if (isOpen) setAmountInput('');
  }, [isOpen]);

  const amount = parseFloat(amountInput);
  const isValid = !isNaN(amount) && amount >= 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Abrir Caja" size="sm">
      <div className="mb-3">
        <label className="form-label fw-bold" htmlFor="fondoInicial">Fondo Inicial de Caja</label>
        <div className="input-group">
          <span className="input-group-text">S/</span>
          <input
            id="fondoInicial"
            type="number"
            min={0}
            step="0.10"
            className="form-control"
            placeholder="0.00"
            autoFocus
            value={amountInput}
            onChange={e => setAmountInput(e.target.value)}
          />
        </div>
        <small className="d-block mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          <i className="bi bi-person-badge me-1"></i>Turno a nombre de: <strong>{openedByLabel}</strong>
        </small>
      </div>
      <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-brand btn fw-semibold"
          style={{ borderRadius: 8 }}
          disabled={!isValid}
          onClick={() => { if (isValid) { onConfirm(round2(amount)); onClose(); } }}
        >
          <i className="bi bi-unlock-fill me-1"></i>Abrir Caja
        </button>
      </div>
    </Modal>
  );
};

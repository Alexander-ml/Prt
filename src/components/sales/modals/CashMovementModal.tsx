import React, { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { round2 } from '../../../utils/money';

/* ─────────────────────────────────────────────────────────────
   CashMovementModal — Movimiento manual de caja (RF-56 v2, punto
   #16 del análisis UX).
   ───────────────────────────────────────────────────────────── */
interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: 'ingreso_manual' | 'retiro_manual', amount: number, description: string) => void;
}

export const CashMovementModal: React.FC<CashMovementModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [type, setType] = useState<'ingreso_manual' | 'retiro_manual'>('ingreso_manual');
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setType('ingreso_manual');
      setAmountInput('');
      setDescription('');
    }
  }, [isOpen]);

  const amount = parseFloat(amountInput);
  const isValid = !isNaN(amount) && amount > 0 && description.trim().length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Movimiento Manual de Caja" size="sm">
      <div className="mb-3">
        <div className="d-flex gap-2">
          <button
            type="button"
            className={`btn flex-fill fw-semibold ${type === 'ingreso_manual' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
            style={{ borderRadius: 8, minHeight: 40 }}
            onClick={() => setType('ingreso_manual')}
          >
            <i className="bi bi-plus-circle me-1"></i>Ingreso
          </button>
          <button
            type="button"
            className={`btn flex-fill fw-semibold ${type === 'retiro_manual' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
            style={{ borderRadius: 8, minHeight: 40 }}
            onClick={() => setType('retiro_manual')}
          >
            <i className="bi bi-dash-circle me-1"></i>Retiro
          </button>
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="movMonto">Monto</label>
        <div className="input-group">
          <span className="input-group-text">S/</span>
          <input
            id="movMonto"
            type="number"
            min={0}
            step="0.10"
            className="form-control"
            placeholder="0.00"
            value={amountInput}
            onChange={e => setAmountInput(e.target.value)}
          />
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="movDesc">Motivo</label>
        <input
          id="movDesc"
          type="text"
          className="form-control"
          style={{ borderRadius: 8 }}
          placeholder={type === 'ingreso_manual' ? 'Ej. Cambio adicional del banco' : 'Ej. Pago a proveedor de emergencia'}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
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
          onClick={() => { if (isValid) { onConfirm(type, round2(amount), description.trim()); onClose(); } }}
        >
          <i className="bi bi-check-lg me-1"></i>Registrar
        </button>
      </div>
    </Modal>
  );
};

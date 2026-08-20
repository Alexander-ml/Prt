import React from 'react';
import type { Insumo } from '../../types';
import { Modal } from '../common/Modal';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  targetInsumo: Insumo | null;
  quantity: number;
  onQuantityChange: (value: number) => void;
  isRestock: boolean;
  onTypeChange: (isRestock: boolean) => void;
}

/**
 * StockMovementModal — Modal de Ingreso / Consumo-Ajuste manual de stock
 * (RF-68, RF-69). Preserva tal cual el resumen de insumo y el toggle de
 * tipo que ya existían en InventoryPage.tsx — es la parte del módulo
 * viejo que ya funcionaba bien y no había que tocar. Componente
 * controlado: `InsumosView` decide qué pasa al enviar (llama
 * `registerInsumoMovement`).
 */
export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  targetInsumo,
  quantity,
  onQuantityChange,
  isRestock,
  onTypeChange,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Movimiento de Stock: ${targetInsumo?.name ?? ''}`}
    >
      <form onSubmit={onSubmit}>
        {targetInsumo && (
          <div
            className="rounded-3 p-3 mb-4 d-flex align-items-center gap-3"
            style={{ background: 'var(--bs-secondary-bg, #f8f9fa)' }}
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 44, height: 44, background: 'var(--brand-primary-soft)' }}
            >
              <i className="bi bi-boxes" style={{ color: '#f97316', fontSize: 20 }} />
            </div>
            <div>
              <div className="fw-bold text-dark">{targetInsumo.name}</div>
              <div className="fs-7 text-muted">
                Stock actual:{' '}
                <span
                  className="fw-semibold"
                  style={{
                    color: targetInsumo.currentStock <= targetInsumo.minStock ? '#dc3545' : '#10b981',
                  }}
                >
                  {targetInsumo.currentStock} {targetInsumo.unit}
                </span>
                {' '}· Mínimo: {targetInsumo.minStock} {targetInsumo.unit}
              </div>
            </div>
          </div>
        )}

        <div className="mb-3">
          <label className="form-label fs-7 fw-semibold text-dark">Tipo de Movimiento</label>
          <div className="d-flex gap-2">
            <button
              type="button"
              className={`btn flex-grow-1 ${isRestock ? 'btn-success text-white' : 'btn-outline-secondary'}`}
              style={{ borderRadius: 8 }}
              onClick={() => onTypeChange(true)}
            >
              <i className="bi bi-box-arrow-in-down me-1" />
              Ingreso
            </button>
            <button
              type="button"
              className={`btn flex-grow-1 ${!isRestock ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
              style={{ borderRadius: 8 }}
              onClick={() => onTypeChange(false)}
            >
              <i className="bi bi-box-arrow-up me-1" />
              Consumo / Ajuste
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="movementQtyInput" className="form-label fs-7 fw-semibold text-dark">
            Cantidad ({targetInsumo?.unit}) *
          </label>
          <input
            id="movementQtyInput"
            type="number"
            step="0.5"
            min="0.1"
            className="form-control form-control-lg fw-bold text-center"
            required
            value={quantity}
            style={{ borderRadius: 8 }}
            onChange={e => onQuantityChange(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="d-flex justify-content-end gap-2 border-top pt-3">
          <button type="button" className="btn btn-light" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-brand fw-semibold">
            <i className="bi bi-arrow-repeat me-1" />
            Registrar Movimiento
          </button>
        </div>
      </form>
    </Modal>
  );
};

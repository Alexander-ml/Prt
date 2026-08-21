import React from 'react';
import type { Dish, Order } from '../../types';
import { Modal } from '../common/Modal';

/* ─────────────────────────────────────────────────────────────
   ObservationModal — Registrar observación especial de un ítem
   de la comanda en construcción (RF-43).
   ───────────────────────────────────────────────────────────── */
interface ObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tempObs: string;
  setTempObs: (val: string) => void;
  onSave: () => void;
}

export const ObservationModal: React.FC<ObservationModalProps> = ({
  isOpen,
  onClose,
  tempObs,
  setTempObs,
  onSave,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Observación Especial">
      <div className="mb-4">
        <label className="form-label" htmlFor="obsInput">Instrucciones para Cocina</label>
        <input
          id="obsInput"
          type="text"
          className="form-control rounded-3"
          placeholder="Ej. Sin picante, término medio, sal reducida..."
          value={tempObs}
          onChange={e => setTempObs(e.target.value)}
          autoFocus
        />
      </div>
      <div className="d-flex justify-content-end gap-2 border-top pt-3">
        <button type="button" className="btn btn-outline-secondary rounded-3" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="btn-brand btn fw-semibold rounded-3" onClick={onSave}>
          Guardar Observación
        </button>
      </div>
    </Modal>
  );
};

/* ─────────────────────────────────────────────────────────────
   AdditionalItemsModal — Agregar ítems a un pedido ya enviado
   a cocina (RF-45).
   ───────────────────────────────────────────────────────────── */
interface AdditionalItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrder: Order | null;
  dishes: Dish[];
  additionalCart: { dish: Dish; quantity: number; observation: string }[];
  onAddDish: (dish: Dish) => void;
  onSend: () => void;
}

export const AdditionalItemsModal: React.FC<AdditionalItemsModalProps> = ({
  isOpen,
  onClose,
  selectedOrder,
  dishes,
  additionalCart,
  onAddDish,
  onSend,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Agregar Ítems Adicionales a Pedido #${selectedOrder?.id}`}
      size="lg"
    >
      <div className="row g-4 mb-3">
        <div className="col-12 col-md-6">
          <label className="form-label">Seleccionar Plato para Añadir</label>
          <div className="d-flex flex-column gap-2 order-additional-dish-list">
            {dishes.filter(d => d.active && d.isAvailableToday).map(d => (
              <div key={d.id} className="p-2 border rounded-3 bg-white d-flex justify-content-between align-items-start">
                <div style={{ minWidth: 0 }}>
                  <div className="order-additional-dish-name">{d.name}</div>
                  <small className="order-additional-dish-price">S/ {d.price.toFixed(2)}</small>
                  {/* Alérgenos — mismo badge/tono que Catálogo, Pedidos y Cocina */}
                  {d.allergens && d.allergens.length > 0 && (
                    <div className="kds-allergen-badge order-additional-dish-allergen">
                      <i className="bi bi-exclamation-octagon-fill flex-shrink-0" aria-hidden="true"></i>
                      <span>Contiene: {d.allergens.join(', ')}</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary flex-shrink-0 ms-2 order-additional-add-button"
                  onClick={() => onAddDish(d)}
                >
                  <i className="bi bi-plus-lg me-1"></i>Añadir
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="col-12 col-md-6 border-start ps-md-4">
          <label className="form-label">Ítems Adicionales por Enviar</label>
          {additionalCart.length === 0 ? (
            <div className="text-center py-4 order-additional-cart-empty">
              <i className="bi bi-cart d-block mb-1" aria-hidden="true"></i>
              Sin adicionales seleccionados.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2 mb-3">
              {additionalCart.map((item, i) => (
                <div key={i} className="p-2 border rounded-3 bg-light d-flex justify-content-between align-items-center">
                  <span className="order-additional-cart-item-name">{item.dish.name} (x{item.quantity})</span>
                  <span className="order-additional-cart-item-price">S/ {(item.dish.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className="btn-brand btn w-100 fw-semibold order-additional-send-button"
            disabled={additionalCart.length === 0}
            onClick={onSend}
          >
            <i className="bi bi-send-fill me-2"></i>Enviar Adicionales a Cocina
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ─────────────────────────────────────────────────────────────
   CancelOrderModal — Cancelación administrativa de un pedido
   (RF-49).
   ───────────────────────────────────────────────────────────── */
interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cancelReason: string;
  setCancelReason: (val: string) => void;
  onConfirm: () => void;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onClose,
  cancelReason,
  setCancelReason,
  onConfirm,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancelar Pedido (Supervisión Administrativa)">
      <div className="mb-4">
        <label className="form-label" htmlFor="cancelReason">Motivo de Cancelación *</label>
        <textarea
          id="cancelReason"
          className="form-control rounded-3"
          rows={3}
          placeholder="Ej. Solicitud explícita del cliente por demoras..."
          required
          value={cancelReason}
          onChange={e => setCancelReason(e.target.value)}
        ></textarea>
      </div>
      <div className="d-flex justify-content-end gap-2 border-top pt-3">
        <button type="button" className="btn btn-outline-secondary rounded-3" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-danger fw-semibold rounded-3"
          disabled={!cancelReason.trim()}
          onClick={onConfirm}
        >
          Confirmar Cancelación
        </button>
      </div>
    </Modal>
  );
};

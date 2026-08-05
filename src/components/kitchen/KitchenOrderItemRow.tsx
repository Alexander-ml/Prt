import React, { useEffect, useRef, useState } from 'react';
import type { Dish, OrderItem, OrderItemStatus } from '../../types';

interface KitchenOrderItemRowProps {
  item: OrderItem;
  dish?: Dish;
  isNew: boolean;
  onSetStatus: (newStatus: OrderItemStatus) => void;
  onRequestCancel: () => void;
}

/**
 * KitchenOrderItemRow — Un plato dentro de un ticket del KDS.
 *
 * Encapsula: alérgenos (dato estructurado del catálogo, no depende de que el
 * mesero haya escrito una observación), el badge "NUEVO" para ítems
 * agregados después del envío original, y un "deshacer" de 5s tras marcar
 * "Listo" para absorber toques accidentales sin bloquear el flujo normal.
 */
export const KitchenOrderItemRow: React.FC<KitchenOrderItemRowProps> = ({
  item,
  dish,
  isNew,
  onSetStatus,
  onRequestCancel,
}) => {
  const [showUndo, setShowUndo] = useState(false);
  const undoTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) window.clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const isCancelled = item.status === 'cancelado';
  const isReady = item.status === 'listo' || item.status === 'entregado';
  const isPreparing = item.status === 'preparando';

  const handleMarkReady = () => {
    onSetStatus('listo');
    setShowUndo(true);
    if (undoTimeoutRef.current) window.clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = window.setTimeout(() => setShowUndo(false), 5000);
  };

  const handleUndo = () => {
    onSetStatus('preparando');
    setShowUndo(false);
    if (undoTimeoutRef.current) window.clearTimeout(undoTimeoutRef.current);
  };

  const itemClass = isCancelled
    ? 'kds-item item-cancelled'
    : isReady
    ? 'kds-item item-ready'
    : isPreparing
    ? 'kds-item item-preparing'
    : 'kds-item';

  return (
    <div className={itemClass}>
      {/* Cantidad + nombre + badges de estado del ítem */}
      <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
        <div className="d-flex align-items-center gap-2 flex-wrap" style={{ minWidth: 0 }}>
          <span className="badge bg-dark rounded-pill fs-6 px-2 py-1 flex-shrink-0">{item.quantity}x</span>
          <span
            className={`fw-bold fs-5 ${isCancelled ? 'text-decoration-line-through text-muted' : 'text-dark'}`}
          >
            {item.dishName}
          </span>
          {isNew && !isCancelled && (
            <span className="kds-new-badge" aria-label="Ítem agregado después del envío original">
              <i className="bi bi-stars me-1" aria-hidden="true"></i>
              NUEVO
            </span>
          )}
        </div>

        {!isCancelled && !isReady && (
          <button
            type="button"
            className="btn-icon btn-icon-danger flex-shrink-0"
            style={{ width: 30, height: 30 }}
            title="Cancelar este ítem (agotado / cliente cambió de opinión)"
            aria-label={`Cancelar ${item.dishName}`}
            onClick={onRequestCancel}
          >
            <i className="bi bi-x-lg" style={{ fontSize: '0.8rem' }} aria-hidden="true"></i>
          </button>
        )}
      </div>

      {/* Alérgenos — dato fijo del catálogo, siempre visible sin depender de la observación */}
      {!isCancelled && dish?.allergens && dish.allergens.length > 0 && (
        <div className="kds-allergen-badge">
          <i className="bi bi-exclamation-octagon-fill flex-shrink-0" aria-hidden="true"></i>
          <span>Contiene: {dish.allergens.join(', ')}</span>
        </div>
      )}

      {/* Observación especial del mesero */}
      {item.observation && !isCancelled && (
        <div className="d-flex align-items-start gap-2 p-2 mb-2 rounded-3 bg-warning-subtle border border-warning-subtle text-warning-emphasis">
          <i className="bi bi-exclamation-circle-fill flex-shrink-0 mt-1" aria-hidden="true"></i>
          <small className="fw-semibold mb-0">{item.observation}</small>
        </div>
      )}

      {/* Ítem cancelado: motivo en vez de acciones */}
      {isCancelled && (
        <div className="d-flex align-items-start gap-2 p-2 rounded-3 bg-secondary-subtle text-secondary-emphasis">
          <i className="bi bi-slash-circle-fill flex-shrink-0 mt-1" aria-hidden="true"></i>
          <small className="fw-semibold mb-0">
            Cancelado{item.cancelReason ? ` — ${item.cancelReason}` : ''}
          </small>
        </div>
      )}

      {/* Deshacer tras marcar "Listo" por error */}
      {showUndo && item.status === 'listo' && (
        <button
          type="button"
          className="kds-undo-bar"
          onClick={handleUndo}
        >
          <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>
          Marcado como listo — Deshacer
        </button>
      )}

      {/* Botones de estado */}
      {!isCancelled && (
        <div className="btn-group w-100" role="group" aria-label={`Estado de ${item.dishName}`}>
          <button
            type="button"
            className={`kds-status-btn btn ${item.status === 'preparando' ? 'btn-warning' : 'btn-outline-secondary'}`}
            aria-pressed={item.status === 'preparando'}
            onClick={() => onSetStatus('preparando')}
          >
            <i className="bi bi-fire me-1" aria-hidden="true"></i>
            Preparando
          </button>
          <button
            type="button"
            className={`kds-status-btn btn ${isReady ? 'btn-success' : 'btn-outline-secondary'}`}
            aria-pressed={isReady}
            onClick={handleMarkReady}
          >
            <i className="bi bi-check-lg me-1" aria-hidden="true"></i>
            Listo
          </button>
        </div>
      )}
    </div>
  );
};
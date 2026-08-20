import React, { useEffect, useRef, useState } from 'react';
import type { Dish, OrderItem, OrderItemStatus } from '../../types';
import { KDS_ITEM_STATUS_META } from './kitchenMeta';

interface KitchenOrderItemRowProps {
  item: OrderItem;
  dish?: Dish;
  isNew: boolean;
  onSetStatus: (newStatus: OrderItemStatus) => void;
  onRequestCancel: () => void;
}

/**
 * Ítem operativo de una comanda. Expone una sola acción principal según el
 * estado actual y mantiene la cancelación accesible, pero visualmente aparte.
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

  useEffect(() => () => {
    if (undoTimeoutRef.current) window.clearTimeout(undoTimeoutRef.current);
  }, []);

  const isCancelled = item.status === 'cancelado';
  const isReady = item.status === 'listo' || item.status === 'entregado';
  const isPreparing = item.status === 'preparando';
  const statusMeta = KDS_ITEM_STATUS_META[item.status];

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
    : 'kds-item item-pending';

  return (
    <article className={itemClass}>
      <div className="kds-item-heading">
        <div className="kds-item-title-wrap">
          <span className="kds-item-quantity">{item.quantity}×</span>
          <h3 className={isCancelled ? 'is-cancelled' : ''}>{item.dishName}</h3>
          {isNew && !isCancelled && (
            <span className="kds-new-badge" aria-label="Ítem agregado después del envío original">
              <i className="bi bi-stars" aria-hidden="true"></i>
              Nuevo
            </span>
          )}
        </div>
        <span className={`kds-item-state is-${statusMeta.tone}`}>
          <i className={`bi ${statusMeta.icon}`} aria-hidden="true"></i>
          {statusMeta.label}
        </span>
      </div>

      {!isCancelled && dish?.allergens && dish.allergens.length > 0 && (
        <p className="kds-item-allergens">
          <i className="bi bi-exclamation-octagon-fill" aria-hidden="true"></i>
          Contiene: {dish.allergens.join(', ')}
        </p>
      )}

      {item.observation && !isCancelled && (
        <p className="kds-item-observation">
          <i className="bi bi-chat-left-text-fill" aria-hidden="true"></i>
          {item.observation}
        </p>
      )}

      {isCancelled && (
        <p className="kds-item-cancel-reason">
          <i className="bi bi-slash-circle-fill" aria-hidden="true"></i>
          Cancelado{item.cancelReason ? ` — ${item.cancelReason}` : ''}
        </p>
      )}

      {showUndo && item.status === 'listo' && (
        <button type="button" className="kds-undo-bar" onClick={handleUndo}>
          <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
          Marcado como listo — Deshacer
        </button>
      )}

      {!isCancelled && !isReady && (
        <div className="kds-item-actions">
          {isPreparing ? (
            <button type="button" className="btn btn-success kds-item-next-action" onClick={handleMarkReady}>
              <i className="bi bi-check-lg" aria-hidden="true"></i>
              Marcar listo
            </button>
          ) : (
            <button type="button" className="btn-brand btn kds-item-next-action" onClick={() => onSetStatus('preparando')}>
              <i className="bi bi-fire" aria-hidden="true"></i>
              Iniciar preparación
            </button>
          )}
          <button type="button" className="btn kds-item-cancel-action" onClick={onRequestCancel}>
            <i className="bi bi-x-circle" aria-hidden="true"></i>
            Cancelar ítem
          </button>
        </div>
      )}

      {!isCancelled && isReady && !showUndo && (
        <p className="kds-item-complete mb-0">
          <i className="bi bi-check2-circle" aria-hidden="true"></i>
          {item.status === 'entregado' ? 'Entregado a sala' : 'Listo'}
        </p>
      )}
    </article>
  );
};

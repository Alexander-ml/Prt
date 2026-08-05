import React from 'react';
import type { Dish, Order, OrderItemStatus } from '../../types';
import { Badge } from '../common/Badge';
import { KitchenOrderItemRow } from './KitchenOrderItemRow';
import { SERVICE_TYPE_META } from './kitchenMeta';
import { getElapsedMinutes, getExpectedMinutes, getTimeStatus, isItemNew } from './kitchenMeta';

interface KitchenOrderCardProps {
  order: Order;
  dishes: Dish[];
  onSetItemStatus: (itemId: string, newStatus: OrderItemStatus) => void;
  onMarkReady: () => void;
  onTogglePriority: () => void;
  onRequestCancelItem: (itemId: string, dishName: string) => void;
  onStartAllPending: () => void;
}

const TIME_BADGE_BG: Record<string, string> = {
  ok: 'bg-success-subtle text-success-emphasis',
  warning: 'bg-warning-subtle text-warning-emphasis',
  urgent: 'bg-danger-subtle text-danger-emphasis',
  unknown: 'bg-secondary-subtle text-secondary-emphasis',
};

export const KitchenOrderCard: React.FC<KitchenOrderCardProps> = ({
  order,
  dishes,
  onSetItemStatus,
  onMarkReady,
  onTogglePriority,
  onRequestCancelItem,
  onStartAllPending,
}) => {
  const isReady = order.status === 'listo';
  const elapsedMinutes = getElapsedMinutes(order.sentToKitchenAt);
  const expectedMinutes = getExpectedMinutes(order, dishes);
  const timeStatus = isReady ? 'ok' : getTimeStatus(elapsedMinutes, expectedMinutes);
  const timeLabel = elapsedMinutes !== null ? `${elapsedMinutes} min` : order.sentToKitchenAt || '—';

  const activeItems = order.items.filter(i => i.status !== 'cancelado');
  const totalItems = activeItems.length;
  const readyItemsCount = activeItems.filter(i => i.status === 'listo' || i.status === 'entregado').length;
  const progressPct = totalItems > 0 ? Math.round((readyItemsCount / totalItems) * 100) : 0;
  const hasPendingItems = !isReady && activeItems.some(i => i.status === 'pendiente');

  const serviceType = order.serviceType ?? 'mesa';
  const serviceMeta = SERVICE_TYPE_META[serviceType];

  const ticketStatusClass = isReady
    ? 'status-ready'
    : timeStatus === 'urgent'
    ? 'status-preparing status-urgent'
    : 'status-preparing';

  return (
    <div className={`kds-ticket ${ticketStatusClass}`}>
      {/* Header */}
      <div className="kds-ticket-header">
        <div className="text-truncate">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h5 className="fw-bold mb-0 fs-2 text-dark lh-1">Mesa #{order.tableNumber}</h5>
            {serviceType !== 'mesa' && (
              <span className="kds-service-badge">
                <i className={`bi ${serviceMeta.icon} me-1`} aria-hidden="true"></i>
                {serviceMeta.label}
              </span>
            )}
            {order.priority && (
              <span className="kds-priority-badge" title="Comanda marcada como prioritaria">
                <i className="bi bi-star-fill me-1" aria-hidden="true"></i>
                Prioridad
              </span>
            )}
          </div>
          <small className="text-muted text-truncate d-block mt-1">
            <i className="bi bi-geo-alt-fill me-1" aria-hidden="true"></i>
            {order.areaName}
            <span className="mx-1">•</span>
            <i className="bi bi-person-badge-fill me-1" aria-hidden="true"></i>
            {order.waiterName}
          </small>
        </div>
        <div className="text-end flex-shrink-0 d-flex flex-column align-items-end gap-1">
          <div className="d-flex align-items-center gap-1">
            {!isReady && (
              <button
                type="button"
                className={`btn-icon ${order.priority ? 'btn-icon-primary' : ''}`}
                style={{ width: 30, height: 30 }}
                aria-pressed={!!order.priority}
                title={order.priority ? 'Quitar prioridad' : 'Marcar como prioritaria'}
                aria-label={order.priority ? 'Quitar prioridad' : 'Marcar como prioritaria'}
                onClick={onTogglePriority}
              >
                <i className={`bi ${order.priority ? 'bi-star-fill' : 'bi-star'}`} style={{ fontSize: '0.85rem' }} aria-hidden="true"></i>
              </button>
            )}
            <Badge status={isReady ? 'LISTO' : 'EN PREPARACIÓN'} variant={isReady ? 'success' : 'warning'} />
          </div>
          <span className={`badge rounded-pill fw-bold ${TIME_BADGE_BG[timeStatus]}`}>
            <i className="bi bi-stopwatch me-1" aria-hidden="true"></i>
            {timeLabel}
          </span>
        </div>
      </div>

      {/* Alerta de urgencia */}
      {!isReady && timeStatus === 'urgent' && (
        <div
          className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-0 rounded-0 border-0 border-bottom"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle-fill fs-5" aria-hidden="true"></i>
          <span className="fw-bold text-uppercase small mb-0">
            Pedido urgente — supera el tiempo estimado ({expectedMinutes} min)
          </span>
        </div>
      )}

      {/* Progreso + acción masiva */}
      <div className="px-3 pt-3">
        <div className="d-flex justify-content-between align-items-center mb-1 gap-2">
          <small className="text-muted fw-semibold text-uppercase">Progreso</small>
          <div className="d-flex align-items-center gap-2">
            {hasPendingItems && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary fw-semibold py-0"
                style={{ fontSize: '0.72rem', borderRadius: 6 }}
                onClick={onStartAllPending}
              >
                <i className="bi bi-lightning-fill me-1" aria-hidden="true"></i>
                Iniciar Todo
              </button>
            )}
            <small className="text-muted fw-bold text-nowrap">
              {readyItemsCount}/{totalItems} listos
            </small>
          </div>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso de preparación de Mesa ${order.tableNumber}: ${progressPct}%`}
        >
          <div
            className={`progress-bar ${isReady ? 'bg-success' : 'bg-warning'}`}
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
      </div>

      {/* Items List */}
      <div className="card-body p-3 d-flex flex-column gap-2">
        {order.items.map(item => (
          <KitchenOrderItemRow
            key={item.id}
            item={item}
            dish={dishes.find(d => d.id === item.dishId)}
            isNew={isItemNew(item, order)}
            onSetStatus={newStatus => onSetItemStatus(item.id, newStatus)}
            onRequestCancel={() => onRequestCancelItem(item.id, item.dishName)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 bg-light border-top mt-auto">
        <button
          type="button"
          className={`btn ${isReady ? 'btn-success' : 'btn-brand'} btn-lg w-100 fw-bold`}
          onClick={onMarkReady}
        >
          <i className={`bi ${isReady ? 'bi-check-circle-fill' : 'bi-bell-fill'} me-2`} aria-hidden="true"></i>
          {isReady ? '¡Comanda Despachada!' : 'Marcar Mesa Lista'}
        </button>
      </div>
    </div>
  );
};
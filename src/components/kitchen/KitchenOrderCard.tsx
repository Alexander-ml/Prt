import React from 'react';
import type { Dish, Order, OrderItemStatus } from '../../types';
import { KitchenOrderItemRow } from './KitchenOrderItemRow';
import {
  SERVICE_TYPE_META,
  TIME_STATUS_LABEL,
  getElapsedMinutes,
  getExpectedMinutes,
  getTimeStatus,
  isItemNew,
  isRecentlySentToKitchen,
} from './kitchenMeta';

interface KitchenOrderCardProps {
  order: Order;
  dishes: Dish[];
  onSetItemStatus: (itemId: string, newStatus: OrderItemStatus) => void;
  onMarkReady: () => void;
  onTogglePriority: () => void;
  onRequestCancelItem: (itemId: string, dishName: string) => void;
  onStartAllPending: () => void;
}

/** Comanda escaneable: identidad, tiempo, progreso, ítems y siguiente acción. */
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
  const isNewOrder = !isReady && isRecentlySentToKitchen(order);
  const timeValue = elapsedMinutes === null ? '—' : `${elapsedMinutes}`;
  const timeDescription = elapsedMinutes === null
    ? TIME_STATUS_LABEL.unknown
    : `${elapsedMinutes} / ${expectedMinutes} min · ${TIME_STATUS_LABEL[timeStatus]}`;

  const activeItems = order.items.filter(item => item.status !== 'cancelado');
  const totalItems = activeItems.length;
  const pendingItemsCount = activeItems.filter(item => item.status === 'pendiente').length;
  const readyItemsCount = activeItems.filter(item => item.status === 'listo' || item.status === 'entregado').length;
  const unfinishedItemsCount = activeItems.length - readyItemsCount;
  const progressPct = totalItems > 0 ? Math.round((readyItemsCount / totalItems) * 100) : 0;
  const serviceType = order.serviceType ?? 'mesa';
  const serviceMeta = SERVICE_TYPE_META[serviceType];

  const ticketStatusClass = isReady
    ? 'status-ready'
    : timeStatus === 'urgent'
    ? 'status-preparing status-urgent'
    : timeStatus === 'warning'
    ? 'status-preparing status-warning'
    : 'status-preparing';

  return (
    <article className={`kds-ticket ${ticketStatusClass}`} aria-label={`Comanda ${order.id} de Mesa ${order.tableNumber}`}>
      <header className="kds-ticket-header">
        <div className="kds-ticket-identity">
          <p className="kds-ticket-order-id">Comanda #{order.id}</p>
          <h2>Mesa #{order.tableNumber}</h2>
          <p className="kds-ticket-location">
            <i className="bi bi-geo-alt-fill" aria-hidden="true"></i>
            {order.areaName}
            <span aria-hidden="true">·</span>
            <i className="bi bi-person-badge-fill" aria-hidden="true"></i>
            {order.waiterName}
          </p>
        </div>
        <div className="kds-ticket-header-tools">
          {!isReady && (
            <button
              type="button"
              className={`btn-icon kds-priority-toggle ${order.priority ? 'btn-icon-primary' : ''}`}
              aria-pressed={!!order.priority}
              title={order.priority ? 'Quitar prioridad manual' : 'Marcar prioridad manual'}
              aria-label={order.priority ? 'Quitar prioridad manual' : 'Marcar prioridad manual'}
              onClick={onTogglePriority}
            >
              <i className={`bi ${order.priority ? 'bi-star-fill' : 'bi-star'}`} aria-hidden="true"></i>
            </button>
          )}
          <div className={`kds-ticket-time is-${timeStatus}`} aria-label={timeDescription}>
            <strong>{timeValue}<small> min</small></strong>
            <span>{timeDescription}</span>
          </div>
        </div>
      </header>

      <div className="kds-ticket-signals">
        {isNewOrder && (
          <span className="kds-new-badge">
            <i className="bi bi-stars" aria-hidden="true"></i>
            Nueva comanda
          </span>
        )}
        {order.priority && (
          <span className="kds-priority-badge">
            <i className="bi bi-star-fill" aria-hidden="true"></i>
            Prioridad manual
          </span>
        )}
        {serviceType !== 'mesa' && (
          <span className="kds-service-badge">
            <i className={`bi ${serviceMeta.icon}`} aria-hidden="true"></i>
            {serviceMeta.label}
          </span>
        )}
        {isReady && (
          <span className="kds-ticket-ready-signal">
            <i className="bi bi-check-circle-fill" aria-hidden="true"></i>
            Lista para pase
          </span>
        )}
      </div>

      <section className="kds-ticket-progress" aria-label="Progreso de la comanda">
        <div>
          <span>Progreso de ítems</span>
          <strong>{readyItemsCount}/{totalItems} listos</strong>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso de preparación de Mesa ${order.tableNumber}: ${progressPct}%`}
        >
          <div className={`progress-bar ${isReady ? 'bg-success' : 'bg-warning'}`} style={{ width: `${progressPct}%` }}></div>
        </div>
      </section>

      <div className="kds-ticket-items">
        {order.items.map(item => (
          <KitchenOrderItemRow
            key={item.id}
            item={item}
            dish={dishes.find(dish => dish.id === item.dishId)}
            isNew={isItemNew(item, order)}
            onSetStatus={newStatus => onSetItemStatus(item.id, newStatus)}
            onRequestCancel={() => onRequestCancelItem(item.id, item.dishName)}
          />
        ))}
      </div>

      {!isReady && (
        <footer className="kds-ticket-footer">
          {pendingItemsCount > 0 && (
            <button type="button" className="btn-brand btn kds-ticket-start-all" onClick={onStartAllPending}>
              <i className="bi bi-lightning-fill" aria-hidden="true"></i>
              Iniciar {pendingItemsCount} pendiente{pendingItemsCount === 1 ? '' : 's'}
            </button>
          )}
          {unfinishedItemsCount > 0 && (
            <button type="button" className="btn kds-ticket-complete-all" onClick={onMarkReady}>
              <i className="bi bi-check2-all" aria-hidden="true"></i>
              Marcar toda la comanda lista
            </button>
          )}
        </footer>
      )}
    </article>
  );
};

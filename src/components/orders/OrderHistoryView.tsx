import React from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { Order, OrderItemStatus, OrderStatus } from '../../types';
import { SectionCard } from '../common/SectionCard';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { SERVICE_TYPE_META } from '../kitchen/kitchenMeta';
import { OrderPreparationStepper } from './OrderPreparationStepper';

interface OrderHistoryViewProps {
  orders: Order[];
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order) => void;
  onClearSelectedOrder: () => void;
  isAdmin: boolean;
  navigate: NavigateFunction;
  onOpenAddItems: () => void;
  onOpenCancel: () => void;
}

const getOrderStatusVariant = (status: OrderStatus) => {
  if (status === 'listo') return 'success' as const;
  if (status === 'en_preparacion') return 'warning' as const;
  if (status === 'cerrado') return 'secondary' as const;
  return 'danger' as const;
};

const getItemStatusVariant = (status: OrderItemStatus) => {
  if (status === 'listo' || status === 'entregado') return 'success' as const;
  if (status === 'preparando') return 'warning' as const;
  if (status === 'cancelado') return 'danger' as const;
  return 'secondary' as const;
};

const formatStatus = (status: string) => status.replace(/_/g, ' ').toUpperCase();

/**
 * OrderHistoryView — Vista de supervisión (RF-48). En móvil sigue el patrón
 * lista → detalle; en anchos mayores conserva el listado y detalle juntos.
 * El estado y las mutaciones siguen viviendo en OrdersPage/AppContext.
 */
export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  orders,
  selectedOrder,
  setSelectedOrder,
  onClearSelectedOrder,
  isAdmin,
  navigate,
  onOpenAddItems,
  onOpenCancel,
}) => {
  return (
    <div className={`row g-4 mb-4 order-history-layout ${selectedOrder ? 'has-selected-order' : ''}`}>
      <div className="col-12 col-lg-5 col-xl-4 order-history-list-pane">
        <SectionCard
          icon="bi-clock-history"
          title="Pedidos por Mesa"
          actions={
            orders.length > 0 ? (
              <span className="badge bg-secondary-subtle text-secondary-emphasis rounded-pill fw-semibold order-count-badge">
                {orders.length} registro{orders.length === 1 ? '' : 's'}
              </span>
            ) : undefined
          }
        >
          <div className="d-flex flex-column gap-2 order-history-list-scroll">
            {orders.length === 0 ? (
              <EmptyState
                icon="bi-inbox"
                title="Sin registros"
                description="Aún no se han registrado pedidos en el sistema."
              />
            ) : (
              orders.map(ord => {
                const itemCount = ord.items.reduce((total, item) => total + item.quantity, 0);
                const orderTotal = ord.items.reduce((total, item) => total + item.price * item.quantity, 0);
                const isSelected = selectedOrder?.id === ord.id;

                return (
                  <div
                    key={ord.id}
                    role="button"
                    tabIndex={0}
                    className={`order-history-list-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedOrder(ord)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedOrder(ord);
                      }
                    }}
                  >
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                      <div>
                        <span className="fw-bold order-history-list-item-title">
                          Mesa #{ord.tableNumber}
                        </span>
                        <small className="d-block order-history-list-item-subtitle">{ord.areaName}</small>
                      </div>
                      <Badge status={formatStatus(ord.status)} variant={getOrderStatusVariant(ord.status)} />
                    </div>
                    <div className="order-history-list-summary">
                      <span><i className="bi bi-receipt me-1" aria-hidden="true"></i>{itemCount} ítem{itemCount === 1 ? '' : 's'} · S/ {orderTotal.toFixed(2)}</span>
                      <span><i className="bi bi-clock me-1" aria-hidden="true"></i>{ord.createdAt}</span>
                    </div>
                    <div className="order-history-list-waiter">
                      <i className="bi bi-person-fill me-1" aria-hidden="true"></i>{ord.waiterName}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      </div>

      <div className="col-12 col-lg-7 col-xl-8 order-history-detail-pane">
        {selectedOrder ? (
          <SectionCard
            icon="bi-receipt"
            title={`Detalle del Pedido #${selectedOrder.id} (Mesa #${selectedOrder.tableNumber})`}
            className="order-history-detail-card"
            actions={
              <div className="order-history-actions">
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 d-sm-none order-history-back"
                  onClick={onClearSelectedOrder}
                >
                  <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>Volver al historial
                </button>
                <div className="d-flex flex-wrap gap-2">
                  {selectedOrder.status !== 'cerrado' && selectedOrder.status !== 'cancelado' && (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm fw-semibold rounded-3"
                      onClick={onOpenAddItems}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Agregar Ítems
                    </button>
                  )}
                  {isAdmin && selectedOrder.status !== 'cancelado' && selectedOrder.status !== 'cerrado' && (
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm fw-semibold rounded-3"
                      onClick={onOpenCancel}
                    >
                      <i className="bi bi-x-circle me-1"></i> Cancelar Pedido
                    </button>
                  )}
                </div>
              </div>
            }
          >
            <section className="order-history-detail-status" aria-label="Estado del pedido">
              <div>
                <span>Estado del pedido</span>
                <Badge status={formatStatus(selectedOrder.status)} variant={getOrderStatusVariant(selectedOrder.status)} />
              </div>
              <dl>
                <div><dt>Mesa</dt><dd>#{selectedOrder.tableNumber} · {selectedOrder.areaName}</dd></div>
                <div><dt>Mesero</dt><dd>{selectedOrder.waiterName}</dd></div>
                <div><dt>Registrado</dt><dd>{selectedOrder.createdAt}</dd></div>
              </dl>
            </section>

            {(selectedOrder.priority || (selectedOrder.serviceType && selectedOrder.serviceType !== 'mesa')) && (
              <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
                {selectedOrder.serviceType && selectedOrder.serviceType !== 'mesa' && (
                  <span className="kds-service-badge">
                    <i className={`bi ${SERVICE_TYPE_META[selectedOrder.serviceType].icon} me-1`} aria-hidden="true"></i>
                    {SERVICE_TYPE_META[selectedOrder.serviceType].label}
                  </span>
                )}
                {selectedOrder.priority && (
                  <span className="kds-priority-badge" title="Comanda marcada como prioritaria en Cocina">
                    <i className="bi bi-star-fill me-1" aria-hidden="true"></i>
                    Prioridad
                  </span>
                )}
              </div>
            )}

            <h3 className="order-history-items-title">Estado de Preparación por Ítem</h3>

            <div className="custom-table-container mb-4 d-none d-sm-block">
              <table className="custom-table order-history-items-table">
                <thead>
                  <tr>
                    <th>Plato</th>
                    <th>Cant.</th>
                    <th>Precio Un.</th>
                    <th>Observaciones</th>
                    <th>Estado Cocina</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map(item => {
                    const isCancelled = item.status === 'cancelado';
                    return (
                      <tr key={item.id} className={isCancelled ? 'is-cancelled' : ''}>
                        <td>
                          <span className={`fw-bold order-history-item-name${isCancelled ? ' is-cancelled' : ''}`}>
                            {item.dishName}
                          </span>
                        </td>
                        <td><span className="fw-bold">{item.quantity}</span></td>
                        <td>S/ {item.price.toFixed(2)}</td>
                        <td>
                          {isCancelled ? (
                            <span className="d-flex align-items-center gap-1 order-history-item-note-empty">
                              <i className="bi bi-slash-circle-fill flex-shrink-0" aria-hidden="true"></i>
                              Cancelado{item.cancelReason ? ` — ${item.cancelReason}` : ''}
                            </span>
                          ) : item.observation ? (
                            <Badge status={item.observation} variant="warning" />
                          ) : (
                            <span className="order-history-item-note-empty">-</span>
                          )}
                        </td>
                        <td><Badge status={formatStatus(item.status)} variant={getItemStatusVariant(item.status)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="d-sm-none order-history-mobile-items mb-4">
              {selectedOrder.items.map(item => {
                const isCancelled = item.status === 'cancelado';
                const lineTotal = item.price * item.quantity;
                return (
                  <article key={item.id} className={`order-history-mobile-item ${isCancelled ? 'is-cancelled' : ''}`}>
                    <div className="order-history-mobile-item-heading">
                      <h4>{item.dishName}</h4>
                      <Badge status={formatStatus(item.status)} variant={getItemStatusVariant(item.status)} />
                    </div>
                    <dl className="order-history-mobile-item-data">
                      <div><dt>Cantidad</dt><dd>{item.quantity}</dd></div>
                      <div><dt>Precio un.</dt><dd>S/ {item.price.toFixed(2)}</dd></div>
                      <div><dt>Subtotal</dt><dd>S/ {lineTotal.toFixed(2)}</dd></div>
                    </dl>
                    {isCancelled ? (
                      <p className="order-history-mobile-note is-cancelled">
                        <i className="bi bi-slash-circle-fill" aria-hidden="true"></i>
                        Cancelado{item.cancelReason ? `: ${item.cancelReason}` : ''}
                      </p>
                    ) : item.observation ? (
                      <p className="order-history-mobile-note">
                        <i className="bi bi-chat-left-text-fill" aria-hidden="true"></i>
                        {item.observation}
                      </p>
                    ) : null}
                    <div className="order-history-mobile-progress">
                      <span>Progreso de cocina</span>
                      <OrderPreparationStepper status={item.status} />
                    </div>
                  </article>
                );
              })}
            </div>

            {selectedOrder.status === 'listo' && (
              <div
                className="p-3 rounded-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 order-history-ready-banner"
              >
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-bell-fill fs-4 order-history-ready-banner-icon"></i>
                  <div>
                    <strong className="d-block order-history-ready-banner-title">
                      ¡Notificación de Cocina!
                    </strong>
                    <span className="order-history-ready-banner-text">
                      Este pedido se encuentra LISTO para retiro en pase.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-success btn-sm fw-semibold rounded-3"
                  onClick={() => navigate('/ventas', { state: { billTableId: selectedOrder.tableId } })}
                >
                  Ir a Cobrar <i className="bi bi-arrow-right ms-1"></i>
                </button>
              </div>
            )}
          </SectionCard>
        ) : (
          <EmptyState
            icon="bi-receipt-cutoff"
            title="Selecciona un pedido"
            description="Haz clic en uno de los pedidos del historial de la izquierda para ver su detalle de cocina y seguimiento."
          />
        )}
      </div>
    </div>
  );
};

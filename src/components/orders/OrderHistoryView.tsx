import React from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { Order } from '../../types';
import { SectionCard } from '../common/SectionCard';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { formatMoney } from '../../utils/money';
import { SERVICE_TYPE_META } from '../kitchen/kitchenMeta';

interface OrderHistoryViewProps {
  orders: Order[];
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order) => void;
  isAdmin: boolean;
  navigate: NavigateFunction;
  onOpenAddItems: () => void;
  onOpenCancel: () => void;
}

/**
 * OrderHistoryView — Vista de supervisión (RF-48): listado de pedidos
 * por mesa a la izquierda, detalle de seguimiento de cocina a la derecha.
 * Puramente presentacional: todo el estado (selectedOrder, modales) vive
 * en OrdersPage y se recibe aquí por props.
 */
export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  orders,
  selectedOrder,
  setSelectedOrder,
  isAdmin,
  navigate,
  onOpenAddItems,
  onOpenCancel,
}) => {
  return (
    <div className="row g-4 mb-4">
      {/* Order List */}
      <div className="col-12 col-lg-5 col-xl-4">
        <SectionCard
          icon="bi-clock-history"
          title="Pedidos por Mesa"
          actions={
            orders.length > 0 ? (
              <span className="badge bg-secondary-subtle text-secondary-emphasis rounded-pill fw-semibold" style={{ fontSize: '0.72rem' }}>
                {orders.length} registro{orders.length === 1 ? '' : 's'}
              </span>
            ) : undefined
          }
        >
          <div className="d-flex flex-column gap-2" style={{ maxHeight: 'clamp(320px, 65vh, 600px)', overflowY: 'auto' }}>
            {orders.length === 0 ? (
              <EmptyState
                icon="bi-inbox"
                title="Sin registros"
                description="Aún no se han registrado pedidos en el sistema."
              />
            ) : (
              orders.map(ord => (
                <div
                  key={ord.id}
                  role="button"
                  tabIndex={0}
                  className="p-3 rounded-3 border cursor-pointer"
                  style={{
                    background: selectedOrder?.id === ord.id ? 'var(--color-brand-light)' : 'var(--surface-card)',
                    borderColor: selectedOrder?.id === ord.id ? 'var(--color-brand)' : 'var(--border-color)',
                    borderWidth: selectedOrder?.id === ord.id ? 2 : 1,
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setSelectedOrder(ord)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedOrder(ord);
                    }
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-bold" style={{ color: 'var(--text-primary)' }}>
                      Mesa #{ord.tableNumber} <small style={{ color: 'var(--text-muted)' }}>({ord.areaName})</small>
                    </span>
                    <Badge
                      status={ord.status.toUpperCase()}
                      variant={
                        ord.status === 'listo'
                          ? 'success'
                          : ord.status === 'en_preparacion'
                          ? 'warning'
                          : ord.status === 'cerrado'
                          ? 'secondary'
                          : 'danger'
                      }
                    />
                  </div>
                  <div className="d-flex justify-content-between" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span><i className="bi bi-person-fill me-1"></i>{ord.waiterName}</span>
                    <span><i className="bi bi-clock me-1"></i>{ord.createdAt}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      {/* Order Detail View */}
      <div className="col-12 col-lg-7 col-xl-8">
        {selectedOrder ? (
          <SectionCard
            icon="bi-receipt"
            title={`Detalle del Pedido #${selectedOrder.id} (Mesa #${selectedOrder.tableNumber})`}
            actions={
              <div className="d-flex flex-wrap gap-2">
                {selectedOrder.status !== 'cerrado' && selectedOrder.status !== 'cancelado' && (
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm fw-semibold"
                    style={{ borderRadius: 8 }}
                    onClick={onOpenAddItems}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Agregar Ítems
                  </button>
                )}
                {isAdmin && selectedOrder.status !== 'cancelado' && selectedOrder.status !== 'cerrado' && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm fw-semibold"
                    style={{ borderRadius: 8 }}
                    onClick={onOpenCancel}
                  >
                    <i className="bi bi-x-circle me-1"></i> Cancelar Pedido
                  </button>
                )}
              </div>
            }
          >
            {/* Prioridad / tipo de servicio — mismo badge que ya muestra Cocina
                (kds-priority-badge / kds-service-badge), para que el mesero/admin
                vea en Pedidos exactamente lo que Cocina está viendo. */}
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

            {/* Items Preparation Tracking Table */}
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Estado de Preparación por Ítem
            </h3>
            <div className="custom-table-container mb-4">
              <table className="custom-table">
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
                      <tr key={item.id} style={isCancelled ? { background: 'var(--surface-muted)' } : undefined}>
                        <td>
                          <span
                            className="fw-bold"
                            style={{
                              color: isCancelled ? 'var(--text-muted)' : 'var(--text-primary)',
                              textDecoration: isCancelled ? 'line-through' : 'none',
                            }}
                          >
                            {item.dishName}
                          </span>
                        </td>
                        <td><span className="fw-bold">{item.quantity}</span></td>
                         <td><span className="fw-bold">{formatMoney(item.price)}</span></td>
                        <td>
                          {isCancelled ? (
                            <span className="d-flex align-items-center gap-1" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                              <i className="bi bi-slash-circle-fill flex-shrink-0" aria-hidden="true"></i>
                              Cancelado{item.cancelReason ? ` — ${item.cancelReason}` : ''}
                            </span>
                          ) : item.observation ? (
                            <Badge status={item.observation} variant="warning" />
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>-</span>
                          )}
                        </td>
                        <td>
                          <Badge
                            status={item.status.toUpperCase()}
                            variant={
                              item.status === 'listo'
                                ? 'success'
                                : item.status === 'preparando'
                                ? 'warning'
                                : 'secondary'
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Notification Banner */}
            {selectedOrder.status === 'listo' && (
              <div
                className="p-3 rounded-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2"
                style={{ background: 'var(--color-emerald-bg)', border: '1px solid #6ee7b7' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-bell-fill fs-4" style={{ color: 'var(--color-emerald)' }}></i>
                  <div>
                    <strong className="d-block" style={{ color: 'var(--color-emerald-text)', fontSize: '0.9rem' }}>
                      ¡Notificación de Cocina!
                    </strong>
                    <span style={{ fontSize: '0.825rem', color: 'var(--color-emerald-text)' }}>
                      Este pedido se encuentra LISTO para retiro en pase.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-success btn-sm fw-semibold"
                  style={{ borderRadius: 8 }}
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
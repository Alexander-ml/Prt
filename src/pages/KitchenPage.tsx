import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { StatCard } from '../components/common/StatCard';

export const KitchenPage: React.FC = () => {
  const {
    orders,
    dishes,
    updateOrderItemStatus,
    markOrderReady,
    notifyDishIndisponibility,
    currentRole,
  } = useApp();

  // Modal for notifying dish unavailability during service (RF-55)
  const [isIndisponibleModalOpen, setIsIndisponibleModalOpen] = useState(false);
  const [selectedDishToMark, setSelectedDishToMark] = useState<string>('');

  // Active Kitchen Tickets (status: en_preparacion or listo) (RF-50)
  const kitchenOrders = orders
    .filter(o => o.status === 'en_preparacion' || o.status === 'listo')
    .sort((a, b) => (a.sentToKitchenAt || '').localeCompare(b.sentToKitchenAt || ''));

  const handleIndisponibleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDishToMark) return;
    notifyDishIndisponibility(selectedDishToMark);
    setIsIndisponibleModalOpen(false);
  };

  // Summary stats
  const activeCommandas = kitchenOrders.filter(o => o.status === 'en_preparacion').length;
  const itemsListos = kitchenOrders.reduce(
    (acc, o) => acc + o.items.filter(i => i.status === 'listo').length,
    0
  );
  const itemsPendientes = kitchenOrders.reduce(
    (acc, o) => acc + o.items.filter(i => i.status === 'pendiente' || i.status === 'preparando').length,
    0
  );

  /**
   * Parse a time string (e.g. "10:35 AM" or "10:35") and compute elapsed minutes
   * relative to the current time. Returns null when parsing fails.
   */
  const getElapsedMinutes = (sentAt: string | undefined): number | null => {
    if (!sentAt) return null;
    try {
      const now = new Date();
      // Build a full date string using today's date so Date can parse it
      const parsed = new Date(`${now.toDateString()} ${sentAt}`);
      if (isNaN(parsed.getTime())) return null;
      return Math.floor((now.getTime() - parsed.getTime()) / 60000);
    } catch {
      return null;
    }
  };

  const getTimeColorClass = (minutes: number | null): string => {
    if (minutes === null) return 'text-secondary';
    if (minutes < 10) return 'text-success';
    if (minutes <= 20) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="container-fluid p-0">
      {/* Page Header */}
      <PageHeader
        icon="bi-display-fill"
        title="Cocina — Kitchen Display System (KDS)"
        subtitle="Control de comandas en tiempo real, tiempos de preparación y disponibilidad de platos (RF-50 – RF-55)."
        actions={
          <button
            className="btn btn-outline-danger fw-semibold"
            onClick={() => setIsIndisponibleModalOpen(true)}
          >
            <i className="bi bi-slash-circle-fill me-2"></i>
            Notificar Agotado
          </button>
        }
      />

      {/* Role Warning Banner */}
      {currentRole !== 'Cocina' && (
        <div className="alert alert-warning rounded-3 d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-info-circle-fill fs-5 flex-shrink-0"></i>
          <span>
            Estás visualizando el KDS como <strong>{currentRole}</strong>. Puedes cambiar al rol{' '}
            <strong>Cocina</strong> desde el menú superior para simular la operación directa del chef.
          </span>
        </div>
      )}

      {/* Summary Stats Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <StatCard
            title="Comandas Activas"
            value={activeCommandas}
            icon="bi-receipt"
            colorTheme="indigo"
          />
        </div>
        <div className="col-12 col-sm-4">
          <StatCard
            title="Items Listos"
            value={itemsListos}
            icon="bi-check-circle-fill"
            colorTheme="emerald"
          />
        </div>
        <div className="col-12 col-sm-4">
          <StatCard
            title="Items Pendientes"
            value={itemsPendientes}
            icon="bi-clock"
            colorTheme="amber"
          />
        </div>
      </div>

      {/* Tickets Grid (RF-50) */}
      {kitchenOrders.length === 0 ? (
        <EmptyState
          icon="bi-check-circle-fill"
          title="¡Cocina al Día!"
          description="No hay pedidos pendientes en la comanda. Todos los platos han sido despachados."
        />
      ) : (
        <div className="row g-4 mb-4">
          {kitchenOrders.map(order => {
            const isReady = order.status === 'listo';
            const elapsedMinutes = getElapsedMinutes(order.sentToKitchenAt);
            const timeColorClass = getTimeColorClass(elapsedMinutes);
            const timeLabel =
              elapsedMinutes !== null
                ? `${elapsedMinutes} min`
                : order.sentToKitchenAt || '—';

            return (
              <div key={order.id} className="col-12 col-md-6 col-xl-4">
                <div className={`kds-ticket h-100 ${isReady ? 'status-ready' : 'status-preparing'}`}>

                  {/* Ticket Header */}
                  <div className="kds-ticket-header bg-light border-bottom d-flex align-items-center justify-content-between">
                    <div>
                      <h5 className="fw-bold mb-0">Mesa #{order.tableNumber}</h5>
                      <small className="text-muted">
                        {order.areaName} • {order.waiterName}
                      </small>
                    </div>
                    <div className="text-end">
                      <Badge
                        status={isReady ? 'LISTO' : 'EN PREPARACIÓN'}
                        variant={isReady ? 'success' : 'warning'}
                      />
                      {/* Elapsed time (RF-54) */}
                      <div className={`fw-bold fs-8 mt-1 ${timeColorClass}`}>
                        <i className="bi bi-stopwatch me-1"></i>
                        {timeLabel} <span className="text-muted fw-normal">(RF-54)</span>
                      </div>
                    </div>
                  </div>

                  {/* Items List (RF-51, RF-52) */}
                  <div className="p-3 d-flex flex-column gap-2">
                    {order.items.map(item => (
                      <div
                        key={item.id}
                        className={`kds-item ${
                          item.status === 'listo'
                            ? 'kds-item-ready'
                            : item.status === 'preparando'
                            ? 'kds-item-preparing'
                            : ''
                        }`}
                      >
                        {/* Quantity + Dish Name */}
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-primary">
                            {item.quantity}x
                          </span>
                          <span className="fw-bold text-dark fs-7">{item.dishName}</span>
                        </div>

                        {/* Special Observation (RF-51) */}
                        {item.observation && (
                          <div className="alert alert-warning p-2 mb-2 d-flex align-items-center gap-2">
                            <i className="bi bi-exclamation-circle-fill flex-shrink-0"></i>
                            <span className="fs-7 fw-semibold">{item.observation}</span>
                          </div>
                        )}

                        {/* Item Status Buttons (RF-52) */}
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            className={`kds-status-btn btn ${
                              item.status === 'preparando'
                                ? ''
                                : 'btn-outline-secondary'
                            }`}
                            style={{
                              padding: '0.4rem 0.85rem',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              borderRadius: 6,
                              ...(item.status === 'preparando'
                                ? { background: '#3b82f6', color: '#fff', border: 'none' }
                                : {}),
                            }}
                            onClick={() => updateOrderItemStatus(order.id, item.id, 'preparando')}
                          >
                            Preparando
                          </button>
                          <button
                            className={`kds-status-btn btn ${
                              item.status === 'listo'
                                ? ''
                                : 'btn-outline-secondary'
                            }`}
                            style={{
                              padding: '0.4rem 0.85rem',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              borderRadius: 6,
                              ...(item.status === 'listo'
                                ? { background: '#10b981', color: '#fff', border: 'none' }
                                : {}),
                            }}
                            onClick={() => updateOrderItemStatus(order.id, item.id, 'listo')}
                          >
                            Listo ✓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ticket Footer Action (RF-53) */}
                  <div className="p-3 bg-light border-top mt-auto">
                    <button
                      className={`btn ${isReady ? 'btn-success' : 'btn-brand'} w-100 fw-bold`}
                      onClick={() => markOrderReady(order.id)}
                    >
                      {isReady ? '¡Comanda Despachada!' : 'Marcar Mesa Lista (RF-53)'}
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notify Dish Indisponibility Modal (RF-55) */}
      <Modal
        isOpen={isIndisponibleModalOpen}
        onClose={() => setIsIndisponibleModalOpen(false)}
        title="Notificar Indisponibilidad de Plato (RF-55)"
        subtitle="Informa inmediatamente a sala sobre la falta de insumos o agotado puntual durante el servicio."
      >
        <form onSubmit={handleIndisponibleSubmit}>
          <div className="mb-4">
            <label className="form-label fs-7 fw-semibold text-dark">Seleccionar Plato Agotado *</label>
            <select
              className="form-select rounded-3"
              required
              value={selectedDishToMark}
              onChange={e => setSelectedDishToMark(e.target.value)}
            >
              <option value="" disabled>Seleccione plato...</option>
              {dishes.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.categoryName}) — Estado Actual: {d.isAvailableToday ? 'DISPONIBLE' : 'AGOTADO'}
                </option>
              ))}
            </select>
            <small className="text-muted d-block mt-2">
              Al marcar como agotado, los meseros verán una alerta inmediata al intentar agregar este plato a nuevas comandas.
            </small>
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-2">
            <button type="button" className="btn btn-light" onClick={() => setIsIndisponibleModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-danger fw-semibold">
              Cambiar Disponibilidad
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

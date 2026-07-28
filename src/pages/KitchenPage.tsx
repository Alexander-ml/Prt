import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';

export const KitchenPage: React.FC = () => {
  const {
    orders,
    dishes,
    updateOrderItemStatus,
    markOrderReady,
    notifyDishIndisponibility,
    currentRole
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

  return (
    <div className="container-fluid p-0">
      {/* KDS Header Bar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold text-dark mb-1">
            <i className="bi bi-display-fill text-amber-600 me-2"></i>
            Pantalla KDS de Cocina (Kitchen Display System)
          </h4>
          <p className="text-muted fs-7 mb-0">
            Control de comanda en cocina, tiempos de preparación e indisponibilidad en tiempo real (RF-50 - RF-55).
          </p>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <button
            className="btn btn-outline-danger btn-md fw-semibold shadow-sm"
            onClick={() => setIsIndisponibleModalOpen(true)}
          >
            <i className="bi bi-slash-circle-fill me-1.5"></i> Notificar Agotado / Indisponible (RF-55)
          </button>
        </div>
      </div>

      {/* Role Banner if not Cocina */}
      {currentRole !== 'Cocina' && (
        <div className="alert alert-warning bg-warning-subtle text-warning-emphasis border-warning-subtle rounded-3 p-3 mb-4 fs-7">
          <i className="bi bi-info-circle-fill me-2"></i>
          Estás navegando la vista KDS como <strong>{currentRole}</strong>. Puedes cambiar a rol <strong>Cocina</strong> desde el menú superior para simular la operación directa del chef.
        </div>
      )}

      {/* Tickets Container (RF-50) */}
      {kitchenOrders.length === 0 ? (
        <EmptyState
          icon="bi-check-circle-fill"
          title="¡Cocina al Día!"
          description="No hay pedidos pendientes en la comanda de cocina. Todos los platos han sido despachados."
        />
      ) : (
        <div className="row g-4 mb-4">
          {kitchenOrders.map(order => {
            const isReady = order.status === 'listo';

            return (
              <div key={order.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                <div className={`kds-ticket h-100 ${isReady ? 'ready' : 'preparing'}`}>
                  {/* Ticket Header */}
                  <div className="p-3 bg-light border-bottom d-flex align-items-center justify-content-between">
                    <div>
                      <h5 className="fw-extrabold text-dark mb-0">Mesa #{order.tableNumber}</h5>
                      <small className="text-muted">{order.areaName} • {order.waiterName}</small>
                    </div>
                    <div className="text-end">
                      <Badge
                        status={isReady ? 'LISTO' : 'EN PREPARACIÓN'}
                        variant={isReady ? 'success' : 'warning'}
                      />
                      {/* Transcurred time display (RF-54) */}
                      <div className="text-danger fw-bold fs-8 mt-1">
                        <i className="bi bi-stopwatch me-1"></i>
                        {order.sentToKitchenAt || 'Hace minutos'} (RF-54)
                      </div>
                    </div>
                  </div>

                  {/* Items List (RF-51, RF-52) */}
                  <div className="p-3 flex-grow-1 d-flex flex-column gap-2">
                    {order.items.map(item => (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-3 border ${
                          item.status === 'listo'
                            ? 'bg-success-subtle border-success-subtle'
                            : item.status === 'preparando'
                            ? 'bg-white border-warning-subtle'
                            : 'bg-light'
                        }`}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="fw-bold text-dark fs-7">
                            <span className="badge bg-primary me-1.5">{item.quantity}x</span>
                            {item.dishName}
                          </span>
                        </div>

                        {/* Special Observations (RF-51) */}
                        {item.observation && (
                          <div className="alert alert-warning p-1 px-2 mb-2 fs-8 fw-semibold border-0 rounded-2">
                            <i className="bi bi-exclamation-circle-fill me-1"></i>
                            {item.observation}
                          </div>
                        )}

                        {/* Item Status Change Buttons (RF-52) */}
                        <div className="d-flex gap-1 pt-1 justify-content-end">
                          <button
                            className={`btn btn-xs ${item.status === 'preparando' ? 'btn-warning text-dark' : 'btn-light border'} fw-semibold px-2 py-0.5 fs-8`}
                            onClick={() => updateOrderItemStatus(order.id, item.id, 'preparando')}
                          >
                            Preparando
                          </button>
                          <button
                            className={`btn btn-xs ${item.status === 'listo' ? 'btn-success text-white' : 'btn-light border'} fw-semibold px-2 py-0.5 fs-8`}
                            onClick={() => updateOrderItemStatus(order.id, item.id, 'listo')}
                          >
                            Listo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ticket Footer Action (RF-53) */}
                  <div className="p-3 bg-light border-top mt-auto">
                    <button
                      className={`btn ${isReady ? 'btn-success' : 'btn-brand'} w-100 fw-bold shadow-sm`}
                      onClick={() => markOrderReady(order.id)}
                    >
                      <i className="bi bi-check2-all me-1.5"></i>
                      {isReady ? '¡Comanda Despachada!' : 'Marcar Toda la Mesa LISTA (RF-53)'}
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

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { StatCard } from '../components/common/StatCard';
import { CustomDropdownSelect } from '../components/common/CustomDropdownSelect';

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

  /**
   * Traduce un porcentaje de progreso a la clase utilitaria de ancho nativa
   * de Bootstrap más cercana (redondeando hacia abajo), evitando así el uso
   * de estilos inline para dimensionar la barra de progreso.
   */
  const getProgressWidthClass = (pct: number): string => {
    if (pct >= 100) return 'w-100';
    if (pct >= 75) return 'w-75';
    if (pct >= 50) return 'w-50';
    if (pct >= 25) return 'w-25';
    return '';
  };

  // Derivado solo de presentación: cuántos pedidos activos superan los 20
  // minutos de espera. No altera la lógica de negocio ni el estado.
  const urgentOrdersCount = kitchenOrders.filter(o => {
    if (o.status === 'listo') return false;
    const minutes = getElapsedMinutes(o.sentToKitchenAt);
    return minutes !== null && minutes > 20;
  }).length;

  return (
    <div className="container-fluid p-0">
      {/* Page Header */}
      <PageHeader
        icon="bi-display-fill"
        title="Cocina - Kitchen Display System (KDS)"
        subtitle="Control de comandas en tiempo real, tiempos de preparación y disponibilidad de platos."
        actions={
          <button
            type="button"
            className="btn btn-outline-danger fw-semibold"
            onClick={() => setIsIndisponibleModalOpen(true)}
          >
            <i className="bi bi-slash-circle-fill me-2" aria-hidden="true"></i>
            Notificar Agotado
          </button>
        }
      />

      {/* Summary Stats Row */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 mb-4">
        <div className="col">
          <StatCard
            title="Comandas Activas"
            value={activeCommandas}
            icon="bi-receipt"
            colorTheme="indigo"
          />
        </div>
        <div className="col">
          <StatCard
            title="Items Listos"
            value={itemsListos}
            icon="bi-check-circle-fill"
            colorTheme="emerald"
          />
        </div>
        <div className="col">
          <StatCard
            title="Items Pendientes"
            value={itemsPendientes}
            icon="bi-clock"
            colorTheme="amber"
          />
        </div>
        <div className="col">
          <StatCard
            title="Pedidos Urgentes"
            value={urgentOrdersCount}
            icon="bi-alarm-fill"
            colorTheme="rose"
          />
        </div>
      </div>

      {/* Tickets Grid */}
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
            const timeLabel =
              elapsedMinutes !== null
                ? `${elapsedMinutes} min`
                : order.sentToKitchenAt || '—';

            // Derivados solo de presentación (no alteran la lógica de negocio)
            const isUrgent = !isReady && elapsedMinutes !== null && elapsedMinutes > 20;
            const timeBadgeBg =
              elapsedMinutes === null
                ? 'bg-secondary-subtle text-secondary-emphasis'
                : elapsedMinutes < 10
                ? 'bg-success-subtle text-success-emphasis'
                : elapsedMinutes <= 20
                ? 'bg-warning-subtle text-warning-emphasis'
                : 'bg-danger-subtle text-danger-emphasis';
            const cardBorderClass = isReady
              ? 'border-success'
              : isUrgent
              ? 'border-danger border-3'
              : 'border-warning';
            const headerBgClass = isReady
              ? 'bg-success-subtle'
              : isUrgent
              ? 'bg-danger-subtle'
              : 'bg-warning-subtle';
            const totalItems = order.items.length;
            const readyItemsCount = order.items.filter(i => i.status === 'listo').length;
            const progressPct = totalItems > 0 ? Math.round((readyItemsCount / totalItems) * 100) : 0;
            const progressWidthClass = getProgressWidthClass(progressPct);

            return (
              <div key={order.id} className="col-12 col-md-6 col-xl-4 col-xxl-3">
                <div className={`card h-100 shadow-sm rounded-4 overflow-hidden border d-flex flex-column ${cardBorderClass}`}>
                  {/* Ticket Header */}
                  <div
                    className={`card-header border-bottom px-3 py-2 d-flex align-items-start justify-content-between gap-2 ${headerBgClass}`}
                  >
                    <div className="text-truncate">
                      <h5 className="fw-bold mb-0 fs-2 text-dark lh-1">Mesa #{order.tableNumber}</h5>
                      <small className="text-muted text-truncate d-block mt-1">
                        <i className="bi bi-geo-alt-fill me-1" aria-hidden="true"></i>
                        {order.areaName}
                        <span className="mx-1">•</span>
                        <i className="bi bi-person-badge-fill me-1" aria-hidden="true"></i>
                        {order.waiterName}
                      </small>
                    </div>
                    <div className="text-end flex-shrink-0 d-flex flex-column align-items-end gap-1">
                      <Badge
                        status={isReady ? 'LISTO' : 'EN PREPARACIÓN'}
                        variant={isReady ? 'success' : 'warning'}
                      />
                      <span className={`badge rounded-pill fw-bold ${timeBadgeBg}`}>
                        <i className="bi bi-stopwatch me-1" aria-hidden="true"></i>
                        {timeLabel}
                      </span>
                    </div>
                  </div>

                  {/* Alerta de urgencia — comanda con más de 20 min en espera */}
                  {isUrgent && (
                    <div
                      className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-0 rounded-0 border-0 border-bottom"
                      role="alert"
                    >
                      <i className="bi bi-exclamation-triangle-fill fs-5" aria-hidden="true"></i>
                      <span className="fw-bold text-uppercase small mb-0">
                        Pedido urgente — requiere atención inmediata
                      </span>
                    </div>
                  )}

                  {/* Progreso de preparación */}
                  <div className="px-3 pt-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <small className="text-muted fw-semibold text-uppercase">Progreso</small>
                      <small className="text-muted fw-bold">
                        {readyItemsCount}/{totalItems} listos
                      </small>
                    </div>
                    <div
                      className="progress"
                      role="progressbar"
                      aria-valuenow={progressPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progreso de preparación de Mesa ${order.tableNumber}: ${progressPct}%`}
                    >
                      <div className={`progress-bar ${isReady ? 'bg-success' : 'bg-warning'} ${progressWidthClass}`}></div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="card-body p-3 d-flex flex-column gap-2">
                    {order.items.map(item => {
                      const itemBorderClass =
                        item.status === 'listo'
                          ? 'border-success bg-success-subtle bg-opacity-50'
                          : item.status === 'preparando'
                          ? 'border-warning bg-warning-subtle bg-opacity-50'
                          : 'border-secondary-subtle bg-body';
                      return (
                        <div
                          key={item.id}
                          className={`border-start border-4 rounded-3 p-2 ${itemBorderClass}`}
                        >
                          {/* Quantity + Dish Name */}
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="badge bg-dark rounded-pill fs-5 px-2 py-1">
                              {item.quantity}x
                            </span>
                            <span className="fw-bold text-dark fs-4">{item.dishName}</span>
                          </div>

                          {/* Special Observation */}
                          {item.observation && (
                            <div className="d-flex align-items-start gap-2 p-2 mb-2 rounded-3 bg-warning-subtle border border-warning-subtle text-warning-emphasis">
                              <i className="bi bi-exclamation-circle-fill flex-shrink-0 mt-1" aria-hidden="true"></i>
                              <small className="fw-semibold mb-0">{item.observation}</small>
                            </div>
                          )}

                          {/* Item Status Buttons */}
                          <div
                            className="btn-group w-100"
                            role="group"
                            aria-label={`Estado de ${item.dishName}`}
                          >
                            <button
                              type="button"
                              className={`btn fw-semibold ${
                                item.status === 'preparando' ? 'btn-warning' : 'btn-outline-secondary'
                              }`}
                              aria-pressed={item.status === 'preparando'}
                              onClick={() => updateOrderItemStatus(order.id, item.id, 'preparando')}
                            >
                              <i className="bi bi-fire me-1" aria-hidden="true"></i>
                              Preparando
                            </button>
                            <button
                              type="button"
                              className={`btn fw-semibold ${
                                item.status === 'listo' ? 'btn-success' : 'btn-outline-secondary'
                              }`}
                              aria-pressed={item.status === 'listo'}
                              onClick={() => updateOrderItemStatus(order.id, item.id, 'listo')}
                            >
                              <i className="bi bi-check-lg me-1" aria-hidden="true"></i>
                              Listo
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ticket Footer Action */}
                  <div className="p-3 bg-light border-top mt-auto">
                    <button
                      type="button"
                      className={`btn ${isReady ? 'btn-success' : 'btn-brand'} btn-lg w-100 fw-bold`}
                      onClick={() => markOrderReady(order.id)}
                    >
                      <i
                        className={`bi ${isReady ? 'bi-check-circle-fill' : 'bi-bell-fill'} me-2`}
                        aria-hidden="true"
                      ></i>
                      {isReady ? '¡Comanda Despachada!' : 'Marcar Mesa Lista'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notify Dish Indisponibility Modal */}
      <Modal
        isOpen={isIndisponibleModalOpen}
        onClose={() => setIsIndisponibleModalOpen(false)}
        title="Notificar Indisponibilidad de Plato"
        subtitle="Informa inmediatamente a sala sobre la falta de insumos o agotado puntual durante el servicio."
      >
        <form onSubmit={handleIndisponibleSubmit}>
          <div className="mb-4">
            <label id="dishToMarkSelectLabel" htmlFor="dishToMarkSelect" className="form-label fw-semibold text-dark">
              Seleccionar Plato Agotado *
            </label>
            <CustomDropdownSelect
              id="dishToMarkSelect"
              labelId="dishToMarkSelectLabel"
              value={selectedDishToMark}
              onChange={setSelectedDishToMark}
              required
              placeholder="Seleccione plato..."
              options={dishes.map(d => ({
                value: d.id,
                label: d.name,
                description: `${d.categoryName} • Estado actual: ${d.isAvailableToday ? 'Disponible' : 'Agotado'}`,
                icon: d.isAvailableToday ? 'bi-check-circle-fill' : 'bi-x-circle-fill',
                colorVariant: d.isAvailableToday ? 'success' : 'danger',
              }))}
            />
            <div id="dishToMarkHelp" className="form-text mt-2">
              Al marcar como agotado, los meseros verán una alerta inmediata al intentar agregar este plato a nuevas comandas.
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-light" onClick={() => setIsIndisponibleModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-danger fw-semibold" disabled={!selectedDishToMark}>
              <i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>
              Cambiar Disponibilidad
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
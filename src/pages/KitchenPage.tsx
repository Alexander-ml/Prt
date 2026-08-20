import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { ResponsiveSectionNav } from '../components/common/ResponsiveSectionNav';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { CustomDropdownSelect } from '../components/common/CustomDropdownSelect';
import { KitchenStatsRow } from '../components/kitchen/KitchenStatsRow';
import { KitchenToolbar, type KitchenOrderScope, type KitchenViewMode } from '../components/kitchen/KitchenToolbar';
import { KitchenOrderCard } from '../components/kitchen/KitchenOrderCard';
import { KitchenStationBoard } from '../components/kitchen/KitchenStationBoard';
import { useNowTick } from '../hooks/useNowTick';
import { useKitchenAlertSound } from '../hooks/useKitchenAlertSound';
import { getElapsedMinutes, getExpectedMinutes, getKdsQueueRank, getTimeStatus } from '../components/kitchen/kitchenMeta';

const KITCHEN_VIEW_ITEMS = [
  { value: 'mesa', label: 'Por Comanda', icon: 'bi-grid-3x3-gap-fill' },
  { value: 'estacion', label: 'Por Estación', icon: 'bi-diagram-3-fill' },
];

export const KitchenPage: React.FC = () => {
  const {
    orders,
    dishes,
    updateOrderItemStatus,
    markOrderReady,
    notifyDishIndisponibility,
    cancelOrderItem,
    toggleOrderPriority,
  } = useApp();

  // Fuerza un re-render periódico para que los cronómetros de cada ticket
  // avancen "en vivo" sin depender de otra acción del usuario (RF-50).
  useNowTick(15000);

  const {
    enabled: soundEnabled,
    setEnabled: setSoundEnabled,
    playNewOrderBeep,
    playUrgentBeep,
  } = useKitchenAlertSound();

  // --- Estado de la barra de herramientas ---
  const [viewMode, setViewMode] = useState<KitchenViewMode>('mesa');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderScope, setOrderScope] = useState<KitchenOrderScope>('all');

  // --- Modal: Notificar Agotado (RF-55) ---
  const [isIndisponibleModalOpen, setIsIndisponibleModalOpen] = useState(false);
  const [selectedDishToMark, setSelectedDishToMark] = useState('');
  const [indisponibleNote, setIndisponibleNote] = useState('');

  // --- Modal: cancelar un ítem puntual ya comisionado a cocina ---
  const [cancelItemTarget, setCancelItemTarget] = useState<{
    orderId: string;
    itemId: string;
    dishName: string;
  } | null>(null);
  const [cancelItemReason, setCancelItemReason] = useState('');

  // Tickets activos de cocina: en_preparacion o listo (RF-50)
  const kitchenOrders = useMemo(
    () =>
      orders
        .filter(o => o.status === 'en_preparacion' || o.status === 'listo')
        .sort((a, b) => (a.sentToKitchenAt || '').localeCompare(b.sentToKitchenAt || '')),
    [orders]
  );

  // --- Alertas sonoras: comanda nueva / comanda que cruza a "urgente" ---
  // Se guardan en refs (no en estado) porque no deben disparar un re-render
  // por sí mismas; solo necesitan sobrevivir entre renders.
  const knownOrderIdsRef = useRef<Set<string> | null>(null);
  const urgentAlertedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(kitchenOrders.map(o => o.id));

    // Primera carga de la pantalla: solo se registra el estado inicial sin
    // sonar, para no disparar una ronda de beeps por comandas que ya
    // estaban activas antes de que el chef abriera el KDS.
    if (knownOrderIdsRef.current === null) {
      knownOrderIdsRef.current = currentIds;
      kitchenOrders.forEach(order => {
        if (order.status === 'listo') return;
        const status = getTimeStatus(getElapsedMinutes(order.sentToKitchenAt), getExpectedMinutes(order, dishes));
        if (status === 'urgent') urgentAlertedRef.current.add(order.id);
      });
      return;
    }

    kitchenOrders.forEach(order => {
      if (!knownOrderIdsRef.current!.has(order.id)) {
        playNewOrderBeep();
      }
      if (order.status !== 'listo') {
        const status = getTimeStatus(getElapsedMinutes(order.sentToKitchenAt), getExpectedMinutes(order, dishes));
        if (status === 'urgent' && !urgentAlertedRef.current.has(order.id)) {
          playUrgentBeep();
          urgentAlertedRef.current.add(order.id);
        }
      }
    });

    // Limpia el registro de "ya alertado" para comandas que salieron del KDS.
    urgentAlertedRef.current.forEach(id => {
      if (!currentIds.has(id)) urgentAlertedRef.current.delete(id);
    });
    knownOrderIdsRef.current = currentIds;
  }, [kitchenOrders, dishes, playNewOrderBeep, playUrgentBeep]);

  // --- Búsqueda + filtro de estado de comanda + cola operativa ---
  const filteredOrders = useMemo(() => {
    let list = kitchenOrders;
    if (orderScope === 'active') list = list.filter(o => o.status === 'en_preparacion');
    if (orderScope === 'ready') list = list.filter(o => o.status === 'listo');

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        o =>
          String(o.tableNumber).includes(q) ||
          o.waiterName.toLowerCase().includes(q) ||
          o.areaName.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      const rankDiff = getKdsQueueRank(a, dishes) - getKdsQueueRank(b, dishes);
      if (rankDiff !== 0) return rankDiff;
      const elapsedA = getElapsedMinutes(a.sentToKitchenAt) ?? 0;
      const elapsedB = getElapsedMinutes(b.sentToKitchenAt) ?? 0;
      return elapsedB - elapsedA;
    });
  }, [kitchenOrders, orderScope, searchQuery, dishes]);

  // --- Resumen (siempre sobre el total real, no sobre lo filtrado) ---
  const activeCommandas = kitchenOrders.filter(o => o.status === 'en_preparacion').length;
  const itemsPendientes = kitchenOrders.reduce(
    (acc, o) => acc + o.items.filter(i => i.status === 'pendiente').length,
    0
  );
  const itemsPreparando = kitchenOrders.reduce(
    (acc, o) => acc + o.items.filter(i => i.status === 'preparando').length,
    0
  );
  const commandasListas = kitchenOrders.filter(o => o.status === 'listo').length;
  const urgentOrdersCount = kitchenOrders.filter(o => {
    if (o.status === 'listo') return false;
    return getTimeStatus(getElapsedMinutes(o.sentToKitchenAt), getExpectedMinutes(o, dishes)) === 'urgent';
  }).length;

  // --- Handlers ---
  const handleStartAllPending = (orderId: string) => {
    const order = kitchenOrders.find(o => o.id === orderId);
    if (!order) return;
    order.items
      .filter(i => i.status === 'pendiente')
      .forEach(i => updateOrderItemStatus(orderId, i.id, 'preparando'));
  };

  const handleRequestCancelItem = (orderId: string, itemId: string, dishName: string) => {
    setCancelItemTarget({ orderId, itemId, dishName });
    setCancelItemReason('');
  };

  const handleConfirmCancelItem = () => {
    if (!cancelItemTarget || !cancelItemReason.trim()) return;
    cancelOrderItem(cancelItemTarget.orderId, cancelItemTarget.itemId, cancelItemReason.trim());
    setCancelItemTarget(null);
    setCancelItemReason('');
  };

  const handleIndisponibleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDishToMark) return;
    notifyDishIndisponibility(selectedDishToMark, indisponibleNote.trim() || undefined);
    setIsIndisponibleModalOpen(false);
    setSelectedDishToMark('');
    setIndisponibleNote('');
  };

  // Mesas ya afectadas por el plato seleccionado en el modal de "Agotado",
  // mostrado en vivo antes de confirmar el cambio (RF-55 ampliado).
  const impactedOrdersForSelectedDish = useMemo(() => {
    if (!selectedDishToMark) return [];
    return kitchenOrders.filter(o =>
      o.items.some(i => i.dishId === selectedDishToMark && (i.status === 'pendiente' || i.status === 'preparando'))
    );
  }, [kitchenOrders, selectedDishToMark]);

  return (
    <div className="container-fluid p-0">
      {/* Page Header */}
      <PageHeader
        icon="bi-display-fill"
        title="Cocina - Kitchen Display System (KDS)"
        subtitle="Control de comandas en tiempo real, tiempos de preparación y disponibilidad de platos."
        actions={
          <ResponsiveSectionNav
            items={KITCHEN_VIEW_ITEMS}
            value={viewMode}
            onChange={value => setViewMode(value as KitchenViewMode)}
            ariaLabel="Cambiar vista de cocina"
          />
        }
      />

      {/* Summary Stats Row */}
      <KitchenStatsRow
        activeCommandas={activeCommandas}
        itemsPendientes={itemsPendientes}
        itemsPreparando={itemsPreparando}
        commandasListas={commandasListas}
        urgentOrdersCount={urgentOrdersCount}
      />

      {/* Toolbar: búsqueda, filtro de comandas, alertas y herramientas auxiliares */}
      <KitchenToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        orderScope={orderScope}
        onOrderScopeChange={setOrderScope}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenIndisponible={() => setIsIndisponibleModalOpen(true)}
      />

      {/* Tickets */}
      {kitchenOrders.length === 0 ? (
        <EmptyState
          icon="bi-check-circle-fill"
          title="¡Cocina al Día!"
          description="No hay pedidos pendientes en la comanda. Todos los platos han sido despachados."
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon="bi-search"
          title="Sin resultados"
          description="Ningún ticket activo coincide con la búsqueda o los filtros aplicados."
        />
      ) : viewMode === 'estacion' ? (
        <KitchenStationBoard
          orders={filteredOrders}
          dishes={dishes}
          onSetItemStatus={updateOrderItemStatus}
          onRequestCancelItem={handleRequestCancelItem}
        />
      ) : (
        <div className="kds-orders-grid mb-4">
          {filteredOrders.map(order => (
            <div key={order.id}>
              <KitchenOrderCard
                order={order}
                dishes={dishes}
                onSetItemStatus={(itemId, newStatus) => updateOrderItemStatus(order.id, itemId, newStatus)}
                onMarkReady={() => markOrderReady(order.id)}
                onTogglePriority={() => toggleOrderPriority(order.id)}
                onRequestCancelItem={(itemId, dishName) => handleRequestCancelItem(order.id, itemId, dishName)}
                onStartAllPending={() => handleStartAllPending(order.id)}
              />
            </div>
          ))}
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
          <div className="mb-3">
            <label id="dishToMarkSelectLabel" htmlFor="dishToMarkSelect" className="form-label">
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
          </div>

          {impactedOrdersForSelectedDish.length > 0 && (
            <div className="d-flex align-items-start gap-2 p-3 mb-3 rounded-3 bg-danger-subtle border border-danger-subtle text-danger-emphasis">
              <i className="bi bi-exclamation-triangle-fill flex-shrink-0 mt-1" aria-hidden="true"></i>
              <small className="fw-semibold mb-0">
                Este plato ya está pedido en {impactedOrdersForSelectedDish.length > 1 ? 'las mesas' : 'la mesa'}:{' '}
                {impactedOrdersForSelectedDish.map(o => `#${o.tableNumber}`).join(', ')}. Sala será notificada para
                ofrecer un reemplazo.
              </small>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="indisponibleNote" className="form-label">
              Nota para sala (opcional)
            </label>
            <textarea
              id="indisponibleNote"
              className="form-control"
              rows={2}
              placeholder="Ej. Vuelve a estar disponible en 20 minutos..."
              value={indisponibleNote}
              onChange={e => setIndisponibleNote(e.target.value)}
            ></textarea>
            <div id="dishToMarkHelp" className="form-text mt-2">
              Al marcar como agotado, los meseros verán una alerta inmediata al intentar agregar este plato a nuevas
              comandas.
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

      {/* Cancelar ítem puntual ya comisionado a cocina */}
      <Modal
        isOpen={!!cancelItemTarget}
        onClose={() => setCancelItemTarget(null)}
        title="Cancelar Ítem de la Comanda"
        subtitle={cancelItemTarget ? `${cancelItemTarget.dishName} — se notificará a sala.` : undefined}
      >
        <div className="mb-4">
          <label className="form-label" htmlFor="cancelItemReason">
            Motivo de Cancelación *
          </label>
          <textarea
            id="cancelItemReason"
            className="form-control"
            rows={3}
            placeholder="Ej. Se agotó el insumo a media preparación..."
            required
            value={cancelItemReason}
            onChange={e => setCancelItemReason(e.target.value)}
          ></textarea>
        </div>
        <div className="d-flex justify-content-end gap-2 border-top pt-3">
          <button type="button" className="btn btn-light" onClick={() => setCancelItemTarget(null)}>
            Volver
          </button>
          <button
            type="button"
            className="btn btn-danger fw-semibold"
            disabled={!cancelItemReason.trim()}
            onClick={handleConfirmCancelItem}
          >
            <i className="bi bi-x-circle-fill me-2" aria-hidden="true"></i>
            Confirmar Cancelación
          </button>
        </div>
      </Modal>
    </div>
  );
};

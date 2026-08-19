import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Dish, ServiceType } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { ResponsiveSectionNav } from '../components/common/ResponsiveSectionNav';
import { OrderTakeView } from '../components/orders/OrderTakeView';
import { OrderHistoryView } from '../components/orders/OrderHistoryView';
import { OrdersStatsRow } from '../components/orders/OrdersStatsRow';
import { ObservationModal, AdditionalItemsModal, CancelOrderModal } from '../components/orders/OrderModals';

type OrdersTab = 'take_order' | 'history';

const ORDERS_SECTION_ITEMS = [
  { value: 'take_order', label: 'Tomar Pedido', icon: 'bi-plus-circle' },
  { value: 'history', label: 'Historial', icon: 'bi-clock-history' },
];

export const OrdersPage: React.FC = () => {
  const {
    tables,
    dishes,
    categories,
    orders,
    users,
    createOrder,
    sendOrderToKitchen,
    addItemsToExistingOrder,
    cancelOrder,
    currentRole
  } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = currentRole === 'Administrador';

  // Active view: 'take_order' (active order builder / comanda) vs 'history' (supervision / history RF-48)
  const [activeTab, setActiveTab] = useState<OrdersTab>('take_order');

  // Selected Order: se guarda solo el ID y el objeto completo se deriva de
  // `orders` en cada render (ver `selectedOrder` más abajo). Esto evita una
  // segunda fuente de verdad: si Cocina cancela un ítem o marca prioridad,
  // el cambio ya viene en `orders` (mismo Context) y este detalle se
  // actualiza solo, sin recargar la página ni duplicar estado.
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(() => {
    if (location.state?.focusTableId) {
      const found = orders.find(o => o.tableId === location.state.focusTableId && o.status !== 'cerrado');
      return found?.id ?? null;
    }
    return null;
  });
  const selectedOrder = selectedOrderId ? orders.find(o => o.id === selectedOrderId) ?? null : null;

  // New Order Form Builder State (RF-39, RF-40)
  // Estado inicial calculado de forma perezosa (lazy initial state) a partir
  // de la navegación desde Mesas (createForTableId) o, en su defecto, la
  // primera mesa ocupada / disponible. Reemplaza los dos useEffect previos
  // que hacían setState de forma síncrona al montar (react-hooks/set-state-in-effect):
  // como la navegación hacia "/pedidos" siempre monta esta página de nuevo
  // (es una ruta distinta), calcularlo una sola vez al inicializar el
  // estado logra exactamente el mismo resultado sin el render en cascada
  // que provoca un efecto.
  const [selectedTableId, setSelectedTableId] = useState<string>(() => {
    if (location.state?.createForTableId) return location.state.createForTableId;
    const occupied = tables.find(t => t.status === 'ocupada');
    if (occupied) return occupied.id;
    return tables[0]?.id ?? '';
  });
  const [cartItems, setCartItems] = useState<{ dish: Dish; quantity: number; observation: string }[]>([]);
  const [selectedDishCategory, setSelectedDishCategory] = useState<string>('todas');
  const [dishSearchQuery, setDishSearchQuery] = useState('');

  // Tipo de servicio de la comanda en construcción (mesa / para_llevar / delivery).
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType>('mesa');

  // Mesero que atiende la comanda. Se resuelve desde `users` (rol 'Mesero',
  // activo) en vez de un string fijo — ver `resolvedWaiter` más abajo. Solo
  // se expone un selector si hay más de un mesero activo en el turno.
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>('');

  // Observation Modal state (RF-43)
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [obsIndex, setObsIndex] = useState<number | null>(null);
  const [tempObs, setTempObs] = useState('');

  // Additional Items Modal state (RF-45)
  const [isAddItemsModalOpen, setIsAddItemsModalOpen] = useState(false);
  const [additionalCart, setAdditionalCart] = useState<{ dish: Dish; quantity: number; observation: string }[]>([]);

  // Order Cancellation Modal (RF-49)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Meseros activos — reemplaza el waiterId/waiterName hardcodeado
  // ('usr-2' / 'Juan Pérez') por una resolución real desde el módulo de
  // Usuarios, siguiendo el mismo patrón que `cashierName` en
  // processSaleBilling (AppContext.tsx).
  const activeWaiters = users.filter(u => u.role === 'Mesero' && u.active);
  const resolvedWaiterId =
    selectedWaiterId && activeWaiters.some(w => w.id === selectedWaiterId)
      ? selectedWaiterId
      : activeWaiters[0]?.id ?? '';
  const resolvedWaiter = activeWaiters.find(w => w.id === resolvedWaiterId);

  // Filtered dishes for menu selection
  const filteredDishes = dishes.filter(d => {
    const matchesCat = selectedDishCategory === 'todas' || d.categoryId === selectedDishCategory;
    const matchesSearch = d.name.toLowerCase().includes(dishSearchQuery.toLowerCase());
    return matchesCat && matchesSearch && d.active;
  });

  // Cart operations
  const handleAddToCart = (dish: Dish) => {
    if (!dish.isAvailableToday) {
      alert(`El plato "${dish.name}" ha sido notificado como AGOTADO por cocina.`);
      return;
    }
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.dish.id === dish.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [...prev, { dish, quantity: 1, observation: '' }];
    });
  };

  const handleUpdateCartQuantity = (index: number, delta: number) => {
    setCartItems(prev => {
      const updated = [...prev];
      const nextQty = updated[index].quantity + delta;
      if (nextQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = nextQty;
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveObservation = () => {
    if (obsIndex !== null) {
      setCartItems(prev => {
        const updated = [...prev];
        updated[obsIndex].observation = tempObs;
        return updated;
      });
    }
    setIsObsModalOpen(false);
  };

  // Opens the observation modal for a given cart line (extracted so the
  // JSX that triggers it can live in OrderTakeView without owning state).
  const handleOpenObservationModal = (index: number, currentObs: string) => {
    setObsIndex(index);
    setTempObs(currentObs);
    setIsObsModalOpen(true);
  };

  // Submit & Send Order to Kitchen
  const handleConfirmAndSendOrder = () => {
    if (!selectedTableId || cartItems.length === 0) return;
    const itemsToSubmit = cartItems.map(c => ({
      dishId: c.dish.id,
      dishName: c.dish.name,
      price: c.dish.price,
      quantity: c.quantity,
      observation: c.observation
    }));
    // Mesero real de turno en vez del string fijo anterior. Si por algún
    // motivo no hay ningún Mesero activo registrado (turno mal configurado),
    // se recurre al mismo patrón de respaldo que usa `cashierName` en Ventas:
    // el usuario activo con el rol de la sesión actual.
    const fallbackUser = users.find(u => u.role === currentRole && u.active);
    const waiterId = resolvedWaiter?.id ?? fallbackUser?.id ?? currentRole;
    const waiterName = resolvedWaiter?.name ?? fallbackUser?.name ?? currentRole;
    const orderId = createOrder(selectedTableId, waiterId, waiterName, itemsToSubmit, selectedServiceType);
    sendOrderToKitchen(orderId);
    setCartItems([]);
    setSelectedOrderId(orderId);
  };

  // Additional items cart operations
  const handleAddToAdditionalCart = (dish: Dish) => {
    setAdditionalCart(prev => {
      const existingIdx = prev.findIndex(item => item.dish.id === dish.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [...prev, { dish, quantity: 1, observation: '' }];
    });
  };

  const handleSendAdditionalItems = () => {
    if (!selectedOrder || additionalCart.length === 0) return;
    const itemsToSubmit = additionalCart.map(c => ({
      dishId: c.dish.id,
      dishName: c.dish.name,
      price: c.dish.price,
      quantity: c.quantity,
      observation: c.observation
    }));
    addItemsToExistingOrder(selectedOrder.id, itemsToSubmit);
    sendOrderToKitchen(selectedOrder.id);
    setAdditionalCart([]);
    setIsAddItemsModalOpen(false);
  };

  // Opens the "add items" modal for the currently selected order (extracted
  // so OrderHistoryView can trigger it without owning the modal state).
  const handleOpenAddItemsModal = () => {
    setAdditionalCart([]);
    setIsAddItemsModalOpen(true);
  };

  // Cancel order
  const handleConfirmCancelOrder = () => {
    if (!selectedOrder || !cancelReason.trim()) return;
    cancelOrder(selectedOrder.id, cancelReason);
    setIsCancelModalOpen(false);
    setSelectedOrderId(null);
  };

  // Opens the cancellation modal for the currently selected order.
  const handleOpenCancelModal = () => {
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const selectedTableObj = tables.find(t => t.id === selectedTableId);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);

  const statusMeta: Record< 
    string,
    { label: string; icon: string; badgeVariant: 'success' | 'warning' | 'info' | 'danger'; order: number }
  > = {
    disponible: { label: 'Mesas Disponibles', icon: 'bi-check-circle-fill', badgeVariant: 'success', order: 0 },
    reservada:  { label: 'Mesas Reservadas',  icon: 'bi-bookmark-star-fill', badgeVariant: 'warning', order: 1 },
    limpieza:   { label: 'En Limpieza',       icon: 'bi-droplet-fill',      badgeVariant: 'info',    order: 2 },
    ocupada:    { label: 'Mesas Ocupadas',    icon: 'bi-people-fill',       badgeVariant: 'danger',  order: 3 },
  };

  const sortedTables = [...tables].sort((a, b) => {
    const diff = (statusMeta[a.status]?.order ?? 99) - (statusMeta[b.status]?.order ?? 99);
    return diff !== 0 ? diff : a.number - b.number;
  });

  const groupedTables = sortedTables.reduce((acc: Record<string, typeof sortedTables>, t) => {
    if (!acc[t.status]) acc[t.status] = [];
    acc[t.status].push(t);
    return acc;
  }, {});

  // Métricas para la fila de stats — mismo patrón que KitchenStatsRow (Cocina)
  // y la fila de StatCard de Catálogo (paridad visual entre los 3 módulos).
  const occupiedTablesCount = tables.filter(t => t.status === 'ocupada').length;
  const activeOrdersCount = orders.filter(o => o.status !== 'cerrado' && o.status !== 'cancelado').length;
  const ordersInKitchenCount = orders.filter(o => o.status === 'en_preparacion').length;
  const ordersReadyCount = orders.filter(o => o.status === 'listo').length;

  return (
    <div className="container-fluid p-0">
      {/* Page Header */}
      <PageHeader
        icon="bi-receipt"
        title="Gestión de Pedidos y Comandas"
        subtitle="Toma de pedidos en sala, modificaciones, comisionado a cocina y seguimiento de estado."
        actions={
          <ResponsiveSectionNav
            items={ORDERS_SECTION_ITEMS}
            value={activeTab}
            onChange={value => setActiveTab(value as OrdersTab)}
            ariaLabel="Cambiar vista de pedidos"
          />
        }
      />

      <OrdersStatsRow
        occupiedTables={occupiedTablesCount}
        activeOrders={activeOrdersCount}
        ordersInKitchen={ordersInKitchenCount}
        ordersReady={ordersReadyCount}
      />

      {activeTab === 'take_order' ? (
        <OrderTakeView
          dishes={dishes}
          categories={categories}
          filteredDishes={filteredDishes}
          selectedDishCategory={selectedDishCategory}
          setSelectedDishCategory={setSelectedDishCategory}
          dishSearchQuery={dishSearchQuery}
          setDishSearchQuery={setDishSearchQuery}
          handleAddToCart={handleAddToCart}
          cartItems={cartItems}
          handleUpdateCartQuantity={handleUpdateCartQuantity}
          handleRemoveCartItem={handleRemoveCartItem}
          onOpenObservation={handleOpenObservationModal}
          selectedTableId={selectedTableId}
          setSelectedTableId={setSelectedTableId}
          selectedTableObj={selectedTableObj}
          statusMeta={statusMeta}
          groupedTables={groupedTables}
          cartSubtotal={cartSubtotal}
          handleConfirmAndSendOrder={handleConfirmAndSendOrder}
          selectedServiceType={selectedServiceType}
          setSelectedServiceType={setSelectedServiceType}
          activeWaiters={activeWaiters}
          resolvedWaiterId={resolvedWaiterId}
          setSelectedWaiterId={setSelectedWaiterId}
        />
      ) : (
        <OrderHistoryView
          orders={orders}
          selectedOrder={selectedOrder}
          setSelectedOrder={order => setSelectedOrderId(order.id)}
          onClearSelectedOrder={() => setSelectedOrderId(null)}
          isAdmin={isAdmin}
          navigate={navigate}
          onOpenAddItems={handleOpenAddItemsModal}
          onOpenCancel={handleOpenCancelModal}
        />
      )}

      <ObservationModal
        isOpen={isObsModalOpen}
        onClose={() => setIsObsModalOpen(false)}
        tempObs={tempObs}
        setTempObs={setTempObs}
        onSave={handleSaveObservation}
      />

      <AdditionalItemsModal
        isOpen={isAddItemsModalOpen}
        onClose={() => setIsAddItemsModalOpen(false)}
        selectedOrder={selectedOrder}
        dishes={dishes}
        additionalCart={additionalCart}
        onAddDish={handleAddToAdditionalCart}
        onSend={handleSendAdditionalItems}
      />

      <CancelOrderModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        onConfirm={handleConfirmCancelOrder}
      />
    </div>
  );
};

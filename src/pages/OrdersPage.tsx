import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Order, Dish } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { OrderTakeView } from '../components/orders/OrderTakeView';
import { OrderHistoryView } from '../components/orders/OrderHistoryView';
import { ObservationModal, AdditionalItemsModal, CancelOrderModal } from '../components/orders/OrderModals';

export const OrdersPage: React.FC = () => {
  const {
    tables,
    dishes,
    categories,
    orders,
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
  const [activeTab, setActiveTab] = useState<'take_order' | 'history'>('take_order');

  // Selected Order for detail / editing / additional items
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // New Order Form Builder State (RF-39, RF-40)
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [cartItems, setCartItems] = useState<{ dish: Dish; quantity: number; observation: string }[]>([]);
  const [selectedDishCategory, setSelectedDishCategory] = useState<string>('todas');
  const [dishSearchQuery, setDishSearchQuery] = useState('');

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

  // Handle location state passed from Tables Page
  useEffect(() => {
    if (location.state?.createForTableId) {
      setSelectedTableId(location.state.createForTableId);
    } else if (location.state?.focusTableId) {
      const found = orders.find(o => o.tableId === location.state.focusTableId && o.status !== 'cerrado');
      if (found) setSelectedOrder(found);
    }
  }, [location.state, orders]);

  // Set default selected table if available
  useEffect(() => {
    if (!selectedTableId && tables.length > 0) {
      const occupied = tables.find(t => t.status === 'ocupada');
      if (occupied) setSelectedTableId(occupied.id);
      else setSelectedTableId(tables[0].id);
    }
  }, [tables, selectedTableId]);

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
    const orderId = createOrder(selectedTableId, 'usr-2', 'Juan Pérez', itemsToSubmit);
    sendOrderToKitchen(orderId);
    setCartItems([]);
    const created = orders.find(o => o.id === orderId);
    if (created) setSelectedOrder(created);
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
    setSelectedOrder(null);
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

  return (
    <div className="container-fluid p-0">
      {/* Page Header */}
      <PageHeader
        icon="bi-receipt"
        title="Gestión de Pedidos y Comandas"
        subtitle="Toma de pedidos en sala, modificaciones, comisionado a cocina y seguimiento de estado."
        actions={
          <div
            className="d-flex w-100 gap-2"
            role="tablist"
            aria-label="Cambiar vista de pedidos"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'take_order'}
              className={`btn fw-semibold flex-fill d-flex align-items-center justify-content-center gap-1 ${
                activeTab === 'take_order'
                  ? 'btn-primary'
                  : 'btn-outline-primary'
              }`}
              style={{
                minHeight: 44,
                borderRadius: 8,
                fontSize: 'clamp(0.78rem, 3.2vw, 0.9rem)',
              }}
              onClick={() => setActiveTab('take_order')}
            >
              <i className="bi bi-plus-circle me-1" aria-hidden="true"></i>
              Tomar Pedido
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              className={`btn fw-semibold flex-fill d-flex align-items-center justify-content-center gap-1 ${
                activeTab === 'history'
                  ? 'btn-primary'
                  : 'btn-outline-primary'
              }`}
              style={{
                minHeight: 44,
                borderRadius: 8,
                fontSize: 'clamp(0.78rem, 3.2vw, 0.9rem)',
              }}
              onClick={() => setActiveTab('history')}
            >
              <i className="bi bi-clock-history me-1" aria-hidden="true"></i>
              Historial
            </button>
          </div>
        }
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
        />
      ) : (
        <OrderHistoryView
          orders={orders}
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
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
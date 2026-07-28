import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Order, Dish } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { SearchBar } from '../components/common/SearchBar';
import { EmptyState } from '../components/common/EmptyState';

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

  // Cart operations (RF-40, RF-41, RF-42)
  const handleAddToCart = (dish: Dish) => {
    if (!dish.isAvailableToday) {
      alert(`El plato "${dish.name}" ha sido notificado como AGOTADO por cocina (RF-55).`);
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

  // Submit & Send Order to Kitchen (RF-44)
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

  // Additional items cart operations (RF-45)
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

  // Cancel order (RF-49)
  const handleConfirmCancelOrder = () => {
    if (!selectedOrder || !cancelReason.trim()) return;
    cancelOrder(selectedOrder.id, cancelReason);
    setIsCancelModalOpen(false);
    setSelectedOrder(null);
  };

  const selectedTableObj = tables.find(t => t.id === selectedTableId);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold text-dark mb-1">
            <i className="bi bi-receipt text-primary me-2"></i>
            Gestión de Pedidos y Comandas
          </h4>
          <p className="text-muted fs-7 mb-0">
            Toma de pedidos en sala, modificaciones, comisionado a cocina y seguimiento de estado (RF-39 - RF-49).
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className={`btn btn-sm ${activeTab === 'take_order' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
            onClick={() => setActiveTab('take_order')}
          >
            <i className="bi bi-plus-circle me-1"></i> Tomar Pedido / Comanda
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
            onClick={() => setActiveTab('history')}
          >
            <i className="bi bi-clock-history me-1"></i> Historial y Supervisión (RF-48)
          </button>
        </div>
      </div>

      {activeTab === 'take_order' ? (
        <div className="row g-4 mb-4">
          {/* Left 7 Cols: Catalog Selection & Quick Add (RF-40) */}
          <div className="col-12 col-lg-7 col-xl-8">
            <div className="card glass-card border-0 p-3.5">
              {/* Category Pills & Search */}
              <div className="d-flex flex-column gap-3 mb-3">
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="fw-bold text-dark mb-0">Selección de Platos para Comanda</h6>
                  <span className="badge bg-secondary-subtle text-secondary fs-8">
                    {filteredDishes.length} platos disponibles
                  </span>
                </div>

                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <SearchBar
                      value={dishSearchQuery}
                      onChange={setDishSearchQuery}
                      placeholder="Buscar plato por nombre..."
                    />
                  </div>
                  <div className="col-12 col-md-6 d-flex gap-1 overflow-x-auto pb-1">
                    <button
                      className={`btn btn-sm rounded-pill text-nowrap fw-semibold ${selectedDishCategory === 'todas' ? 'btn-primary' : 'btn-light border text-dark'}`}
                      onClick={() => setSelectedDishCategory('todas')}
                    >
                      Todas
                    </button>
                    {categories.map(c => (
                      <button
                        key={c.id}
                        className={`btn btn-sm rounded-pill text-nowrap fw-semibold ${selectedDishCategory === c.id ? 'btn-primary' : 'btn-light border text-dark'}`}
                        onClick={() => setSelectedDishCategory(c.id)}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dish Selection Grid */}
              <div className="row g-3" style={{ maxHeight: '620px', overflowY: 'auto' }}>
                {filteredDishes.map(dish => (
                  <div key={dish.id} className="col-12 col-sm-6 col-md-4">
                    <div
                      className={`p-3 rounded-3 border bg-white h-100 d-flex flex-column justify-content-between position-relative ${
                        !dish.isAvailableToday ? 'opacity-50' : 'cursor-pointer hover-shadow'
                      }`}
                      style={{ transition: 'all 0.15s ease' }}
                      onClick={() => dish.isAvailableToday && handleAddToCart(dish)}
                    >
                      <div>
                        <div className="d-flex align-items-start justify-content-between gap-1 mb-1">
                          <span className="fw-bold text-dark fs-7 line-clamp-1">{dish.name}</span>
                        </div>
                        <span className="fw-extrabold text-primary fs-6 d-block mb-2">
                          S/ {dish.price.toFixed(2)}
                        </span>
                        {!dish.isAvailableToday && (
                          <Badge status="Agotado Cocina" variant="danger" className="mb-2" />
                        )}
                      </div>
                      <button
                        className="btn btn-sm btn-outline-primary w-100 fw-semibold rounded-2"
                        disabled={!dish.isAvailableToday}
                      >
                        <i className="bi bi-plus-lg me-1"></i> Agregar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Comanda Builder / Cart & Table Selector (RF-39, RF-41, RF-42, RF-43, RF-44) */}
          <div className="col-12 col-lg-5 col-xl-4">
            <div className="card glass-card border-0 p-4 h-100 d-flex flex-column">
              <div className="border-bottom pb-3 mb-3">
                <label className="form-label fs-7 fw-bold text-dark">1. Seleccionar Mesa para Pedido (RF-39)</label>
                <select
                  className="form-select form-select-lg rounded-3 fw-bold border-primary shadow-none"
                  value={selectedTableId}
                  onChange={e => setSelectedTableId(e.target.value)}
                >
                  <option value="" disabled>Elija mesa...</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>
                      Mesa #{t.number} — {t.areaName} ({t.status.toUpperCase()})
                    </option>
                  ))}
                </select>
                {selectedTableObj && (
                  <small className="text-muted d-block mt-1">
                    Capacidad: {selectedTableObj.capacity} pers. • Estado actual: {selectedTableObj.status}
                  </small>
                )}
              </div>

              {/* Cart List */}
              <div className="flex-grow-1 overflow-y-auto mb-3" style={{ maxHeight: '380px' }}>
                <h6 className="fw-bold text-dark mb-2">2. Ítems del Pedido no Enviados</h6>
                {cartItems.length === 0 ? (
                  <div className="text-center py-4 text-muted fs-7 border rounded-3 bg-light">
                    <i className="bi bi-cart-plus text-secondary fs-3 d-block mb-1"></i>
                    Selecciona platos de la lista para armar la comanda.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-3 border bg-white shadow-sm">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="fw-bold text-dark fs-7">{item.dish.name}</span>
                          <span className="fw-bold text-primary fs-7">
                            S/ {(item.dish.price * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        {item.observation && (
                          <div className="text-warning-emphasis fs-8 bg-warning-subtle p-1.5 rounded mb-2">
                            <i className="bi bi-chat-left-text-fill me-1"></i> Obs: {item.observation}
                          </div>
                        )}

                        <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                          {/* Quantity Controls (RF-41) */}
                          <div className="d-flex align-items-center gap-2">
                            <button
                              className="btn btn-sm btn-light border px-2 py-0 fw-bold"
                              onClick={() => handleUpdateCartQuantity(idx, -1)}
                            >
                              -
                            </button>
                            <span className="fw-bold text-dark fs-7">{item.quantity}</span>
                            <button
                              className="btn btn-sm btn-light border px-2 py-0 fw-bold"
                              onClick={() => handleUpdateCartQuantity(idx, 1)}
                            >
                              +
                            </button>
                          </div>

                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-sm btn-link text-warning p-0 me-2"
                              title="Registrar observación (RF-43)"
                              onClick={() => {
                                setObsIndex(idx);
                                setTempObs(item.observation);
                                setIsObsModalOpen(true);
                              }}
                            >
                              <i className="bi bi-pencil"></i> Obs
                            </button>

                            <button
                              className="btn btn-sm btn-link text-danger p-0"
                              title="Eliminar plato (RF-42)"
                              onClick={() => handleRemoveCartItem(idx)}
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total & Send Action */}
              <div className="pt-3 border-top mt-auto">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted fw-semibold">Subtotal Estimado:</span>
                  <span className="fs-4 fw-extrabold text-dark">S/ {cartSubtotal.toFixed(2)}</span>
                </div>

                <button
                  className="btn btn-brand btn-lg w-100 fw-bold shadow"
                  disabled={cartItems.length === 0 || !selectedTableId}
                  onClick={handleConfirmAndSendOrder}
                >
                  <i className="bi bi-send-fill me-2"></i> Confirmar y Enviar a Cocina (RF-44)
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History & Supervision View (RF-46, RF-47, RF-48, RF-49) */
        <div className="row g-4 mb-4">
          <div className="col-12 col-lg-5 col-xl-4">
            {/* Active Orders List */}
            <div className="card glass-card border-0 p-3">
              <h6 className="fw-bold text-dark mb-3 border-bottom pb-2">Historial de Pedidos por Mesa (RF-48)</h6>
              <div className="d-flex flex-column gap-2" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {orders.length === 0 ? (
                  <div className="text-center py-4 text-muted fs-7">Sin registros de pedidos.</div>
                ) : (
                  orders.map(ord => (
                    <div
                      key={ord.id}
                      className={`p-3 rounded-3 border cursor-pointer ${
                        selectedOrder?.id === ord.id ? 'border-primary bg-primary-subtle' : 'bg-white'
                      }`}
                      onClick={() => setSelectedOrder(ord)}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="fw-bold text-dark">
                          Mesa #{ord.tableNumber} — <small className="text-muted">{ord.areaName}</small>
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
                      <div className="d-flex justify-content-between fs-7 text-muted">
                        <span>{ord.waiterName}</span>
                        <span>{ord.createdAt}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Order Detail View (RF-45, RF-46, RF-47, RF-49) */}
          <div className="col-12 col-lg-7 col-xl-8">
            {selectedOrder ? (
              <div className="card glass-card border-0 p-4">
                <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                  <div>
                    <h5 className="fw-bold text-dark mb-0">
                      Detalle del Pedido #{selectedOrder.id} (Mesa #{selectedOrder.tableNumber})
                    </h5>
                    <small className="text-muted">
                      Atendido por: <strong>{selectedOrder.waiterName}</strong> • Enviado a cocina: {selectedOrder.sentToKitchenAt || 'Pendiente'}
                    </small>
                  </div>
                  <div className="d-flex gap-2">
                    {selectedOrder.status !== 'cerrado' && selectedOrder.status !== 'cancelado' && (
                      <button
                        className="btn btn-outline-primary btn-sm fw-semibold"
                        onClick={() => {
                          setAdditionalCart([]);
                          setIsAddItemsModalOpen(true);
                        }}
                      >
                        <i className="bi bi-plus-lg me-1"></i> Agregar Ítems Adicionales (RF-45)
                      </button>
                    )}

                    {isAdmin && selectedOrder.status !== 'cancelado' && selectedOrder.status !== 'cerrado' && (
                      <button
                        className="btn btn-outline-danger btn-sm fw-semibold"
                        onClick={() => {
                          setCancelReason('');
                          setIsCancelModalOpen(true);
                        }}
                      >
                        <i className="bi bi-x-circle me-1"></i> Cancelar Pedido (RF-49)
                      </button>
                    )}
                  </div>
                </div>

                {/* Items Preparation Tracking Table (RF-46) */}
                <h6 className="fw-bold text-dark mb-2">Estado de Preparación por Ítem (RF-46)</h6>
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
                      {selectedOrder.items.map(item => (
                        <tr key={item.id}>
                          <td><span className="fw-bold text-dark">{item.dishName}</span></td>
                          <td><span className="fw-bold">{item.quantity}</span></td>
                          <td>S/ {item.price.toFixed(2)}</td>
                          <td>
                            {item.observation ? (
                              <span className="badge bg-warning-subtle text-warning-emphasis fs-8">
                                {item.observation}
                              </span>
                            ) : (
                              <span className="text-muted fs-8">-</span>
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
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Notification Banner (RF-47) */}
                {selectedOrder.status === 'listo' && (
                  <div className="alert alert-success bg-success-subtle text-success-emphasis border-success-subtle d-flex align-items-center justify-content-between p-3 rounded-3 shadow-sm">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-bell-fill fs-4 text-success"></i>
                      <div>
                        <strong className="d-block">¡Notificación de Cocina (RF-47)!</strong>
                        <span>Este pedido se encuentra LISTO para retiro en pase.</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-success btn-sm fw-semibold"
                      onClick={() => navigate('/ventas', { state: { billTableId: selectedOrder.tableId } })}
                    >
                      Ir a Cobrar <i className="bi bi-arrow-right"></i>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon="bi-receipt-cutoff"
                title="Selecciona un pedido"
                description="Haz clic en uno de los pedidos del historial de la izquierda para ver su detalle de cocina y seguimiento."
              />
            )}
          </div>
        </div>
      )}

      {/* Observation Modal (RF-43) */}
      <Modal
        isOpen={isObsModalOpen}
        onClose={() => setIsObsModalOpen(false)}
        title="Registrar Observación Especial (RF-43)"
      >
        <div className="mb-4">
          <label className="form-label fs-7 fw-semibold text-dark">Instrucciones para Cocina</label>
          <input
            type="text"
            className="form-control rounded-3"
            placeholder="Ej. Sin picante, término medio, sal reducida..."
            value={tempObs}
            onChange={e => setTempObs(e.target.value)}
          />
        </div>
        <div className="d-flex justify-content-end gap-2 border-top pt-2">
          <button className="btn btn-light" onClick={() => setIsObsModalOpen(false)}>Cancelar</button>
          <button className="btn btn-brand fw-semibold" onClick={handleSaveObservation}>Guardar Observación</button>
        </div>
      </Modal>

      {/* Additional Items Modal (RF-45) */}
      <Modal
        isOpen={isAddItemsModalOpen}
        onClose={() => setIsAddItemsModalOpen(false)}
        title={`Agregar Ítems Adicionales a Pedido #${selectedOrder?.id} (RF-45)`}
        size="lg"
      >
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label className="form-label fs-7 fw-bold text-dark">Seleccionar Plato para Añadir</label>
            <div className="d-flex flex-column gap-2" style={{ maxHeight: 300, overflowY: 'auto' }}>
              {dishes.filter(d => d.active && d.isAvailableToday).map(d => (
                <div key={d.id} className="p-2 border rounded bg-white d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold fs-7">{d.name}</div>
                    <small className="text-primary fw-semibold">S/ {d.price.toFixed(2)}</small>
                  </div>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => handleAddToAdditionalCart(d)}>
                    + Añadir
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="col-12 col-md-6 border-start">
            <label className="form-label fs-7 fw-bold text-dark">Ítems Adicionales por Enviar</label>
            {additionalCart.length === 0 ? (
              <div className="text-center py-4 text-muted fs-7">Sin adicionales seleccionados.</div>
            ) : (
              <div className="d-flex flex-column gap-2 mb-3">
                {additionalCart.map((item, i) => (
                  <div key={i} className="p-2 border rounded bg-light d-flex justify-content-between align-items-center">
                    <span className="fw-bold fs-7">{item.dish.name} (x{item.quantity})</span>
                    <span className="fw-bold text-primary">S/ {(item.dish.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            <button
              className="btn btn-brand w-100 fw-semibold"
              disabled={additionalCart.length === 0}
              onClick={handleSendAdditionalItems}
            >
              Enviar Adicionales a Cocina
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Order Modal (RF-49) */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancelar Pedido (Supervisión Admin - RF-49)"
      >
        <div className="mb-4">
          <label className="form-label fs-7 fw-semibold text-dark">Motivo de Cancelación *</label>
          <textarea
            className="form-control rounded-3"
            rows={3}
            placeholder="Ej. Solicitud explícita del cliente por demoras..."
            required
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
          ></textarea>
        </div>
        <div className="d-flex justify-content-end gap-2 border-top pt-2">
          <button className="btn btn-light" onClick={() => setIsCancelModalOpen(false)}>Cancelar</button>
          <button
            className="btn btn-danger fw-semibold"
            disabled={!cancelReason.trim()}
            onClick={handleConfirmCancelOrder}
          >
            Confirmar Cancelación
          </button>
        </div>
      </Modal>
    </div>
  );
};

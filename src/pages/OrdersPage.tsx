import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Order, Dish } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
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

  // Cancel order
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
      {/* Page Header */}
      <PageHeader
        icon="bi-receipt"
        title="Gestión de Pedidos y Comandas"
        subtitle="Toma de pedidos en sala, modificaciones, comisionado a cocina y seguimiento de estado."
        actions={
          <div className="d-flex gap-2">
            <button
              className={`btn btn-sm fw-semibold ${activeTab === 'take_order' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
              style={{ borderRadius: 8 }}
              onClick={() => setActiveTab('take_order')}
            >
              <i className="bi bi-plus-circle me-1.5"></i> Tomar Pedido / Comanda
            </button>
            <button
              className={`btn btn-sm fw-semibold ${activeTab === 'history' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
              style={{ borderRadius: 8 }}
              onClick={() => setActiveTab('history')}
            >
              <i className="bi bi-clock-history me-1.5"></i> Historial y Supervisión
            </button>
          </div>
        }
      />

      {activeTab === 'take_order' ? (
        <div className="row g-4 mb-4">
          {/* Left Cols: Catalog Selection */}
          <div className="col-12 col-lg-7 col-xl-8">
            <SectionCard icon="bi-egg-fried" title="Selección de Platos para Comanda">
              <div className="d-flex flex-column gap-3 mb-3">
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
                      className={`btn btn-sm text-nowrap fw-semibold ${selectedDishCategory === 'todas' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                      style={{ borderRadius: 8 }}
                      onClick={() => setSelectedDishCategory('todas')}
                    >
                      Todas
                    </button>
                    {categories.map(c => (
                      <button
                        key={c.id}
                        className={`btn btn-sm text-nowrap fw-semibold ${selectedDishCategory === c.id ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                        style={{ borderRadius: 8 }}
                        onClick={() => setSelectedDishCategory(c.id)}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dish Selection Grid */}
              <div className="row g-3" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {filteredDishes.map(dish => (
                  <div key={dish.id} className="col-12 col-sm-6 col-md-4">
                    <div
                      className={`p-3 rounded-3 border bg-white h-100 d-flex flex-column justify-content-between ${
                        !dish.isAvailableToday ? 'opacity-50' : 'cursor-pointer'
                      }`}
                      style={{ transition: 'all 0.15s ease', boxShadow: 'var(--shadow-xs)' }}
                      onClick={() => dish.isAvailableToday && handleAddToCart(dish)}
                    >
                      <div>
                        <div className="fw-bold mb-1 text-truncate" style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {dish.name}
                        </div>
                        <span className="fw-extrabold d-block mb-2" style={{ color: 'var(--color-brand)', fontSize: '1rem' }}>
                          S/ {dish.price.toFixed(2)}
                        </span>
                        {!dish.isAvailableToday && (
                          <Badge status="Agotado Cocina" variant="danger" className="mb-2" />
                        )}
                      </div>
                      <button
                        className="btn btn-sm btn-outline-primary w-100 fw-semibold"
                        style={{ borderRadius: 6 }}
                        disabled={!dish.isAvailableToday}
                      >
                        <i className="bi bi-plus-lg me-1"></i> Agregar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Right Cols: Comanda Builder */}
          <div className="col-12 col-lg-5 col-xl-4">
            <SectionCard icon="bi-receipt" title="Comanda de Mesa" className="h-100 d-flex flex-column">
              <div className="border-bottom pb-3 mb-3">
                <label className="form-label fw-bold">1. Seleccionar Mesa</label>
                <select
                  className="form-select form-select-lg fw-bold border-primary shadow-none"
                  style={{ borderRadius: 8 }}
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
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', marginTop: 4 }}>
                    Capacidad: {selectedTableObj.capacity} pers. • Estado: {selectedTableObj.status}
                  </small>
                )}
              </div>

              {/* Cart List */}
              <div className="flex-grow-1 overflow-y-auto mb-3" style={{ maxHeight: '360px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  2. Ítems del Pedido no Enviados
                </h3>
                {cartItems.length === 0 ? (
                  <div className="text-center py-4 border rounded-3" style={{ background: 'var(--surface-muted)', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                    <i className="bi bi-cart-plus d-block mb-1" style={{ fontSize: '1.75rem', color: '#94a3b8' }}></i>
                    Selecciona platos de la lista para armar la comanda.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-3 border bg-white shadow-sm">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="fw-bold" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {item.dish.name}
                          </span>
                          <span className="fw-bold" style={{ fontSize: '0.85rem', color: 'var(--color-brand)' }}>
                            S/ {(item.dish.price * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        {item.observation && (
                          <div className="p-1.5 rounded mb-2" style={{ background: 'var(--color-amber-bg)', color: 'var(--color-amber-text)', fontSize: '0.75rem' }}>
                            <i className="bi bi-chat-left-text-fill me-1"></i> Obs: {item.observation}
                          </div>
                        )}

                        <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                          {/* Quantity Controls */}
                          <div className="d-flex align-items-center gap-2">
                            <button
                              className="btn btn-sm btn-light border px-2 py-0 fw-bold"
                              onClick={() => handleUpdateCartQuantity(idx, -1)}
                            >
                              -
                            </button>
                            <span className="fw-bold fs-7">{item.quantity}</span>
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
                              title="Registrar observación"
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
                              title="Eliminar plato"
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
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Subtotal Estimado:</span>
                  <span className="fw-extrabold" style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>S/ {cartSubtotal.toFixed(2)}</span>
                </div>

                <button
                  className="btn-brand btn w-100 fw-bold py-2.5"
                  style={{ borderRadius: 10, fontSize: '0.95rem' }}
                  disabled={cartItems.length === 0 || !selectedTableId}
                  onClick={handleConfirmAndSendOrder}
                >
                  <i className="bi bi-send-fill me-2"></i> Confirmar y Enviar a Cocina
                </button>
              </div>
            </SectionCard>
          </div>
        </div>
      ) : (
        /* History & Supervision View */
        <div className="row g-4 mb-4">
          <div className="col-12 col-lg-5 col-xl-4">
            <SectionCard icon="bi-clock-history" title="Pedidos por Mesa">
              <div className="d-flex flex-column gap-2" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {orders.length === 0 ? (
                  <div className="text-center py-4" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin registros de pedidos.</div>
                ) : (
                  orders.map(ord => (
                    <div
                      key={ord.id}
                      className="p-3 rounded-3 border cursor-pointer"
                      style={{
                        background: selectedOrder?.id === ord.id ? 'var(--color-brand-light)' : 'var(--surface-card)',
                        borderColor: selectedOrder?.id === ord.id ? 'var(--color-brand)' : 'var(--border-color)',
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => setSelectedOrder(ord)}
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
                        <span>{ord.waiterName}</span>
                        <span>{ord.createdAt}</span>
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
                  <div className="d-flex gap-2">
                    {selectedOrder.status !== 'cerrado' && selectedOrder.status !== 'cancelado' && (
                      <button
                        className="btn btn-outline-primary btn-sm fw-semibold"
                        style={{ borderRadius: 8 }}
                        onClick={() => {
                          setAdditionalCart([]);
                          setIsAddItemsModalOpen(true);
                        }}
                      >
                        <i className="bi bi-plus-lg me-1"></i> Agregar Ítems
                      </button>
                    )}

                    {isAdmin && selectedOrder.status !== 'cancelado' && selectedOrder.status !== 'cerrado' && (
                      <button
                        className="btn btn-outline-danger btn-sm fw-semibold"
                        style={{ borderRadius: 8 }}
                        onClick={() => {
                          setCancelReason('');
                          setIsCancelModalOpen(true);
                        }}
                      >
                        <i className="bi bi-x-circle me-1"></i> Cancelar Pedido
                      </button>
                    )}
                  </div>
                }
              >
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
                      {selectedOrder.items.map(item => (
                        <tr key={item.id}>
                          <td><span className="fw-bold" style={{ color: 'var(--text-primary)' }}>{item.dishName}</span></td>
                          <td><span className="fw-bold">{item.quantity}</span></td>
                          <td>S/ {item.price.toFixed(2)}</td>
                          <td>
                            {item.observation ? (
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
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Notification Banner */}
                {selectedOrder.status === 'listo' && (
                  <div
                    className="p-3 rounded-3 d-flex align-items-center justify-content-between"
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
      )}

      {/* Observation Modal */}
      <Modal
        isOpen={isObsModalOpen}
        onClose={() => setIsObsModalOpen(false)}
        title="Registrar Observación Especial"
      >
        <div className="mb-4">
          <label className="form-label">Instrucciones para Cocina</label>
          <input
            type="text"
            className="form-control"
            style={{ borderRadius: 8 }}
            placeholder="Ej. Sin picante, término medio, sal reducida..."
            value={tempObs}
            onChange={e => setTempObs(e.target.value)}
          />
        </div>
        <div className="d-flex justify-content-end gap-2 border-top pt-2">
          <button className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setIsObsModalOpen(false)}>Cancelar</button>
          <button className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }} onClick={handleSaveObservation}>Guardar Observación</button>
        </div>
      </Modal>

      {/* Additional Items Modal */}
      <Modal
        isOpen={isAddItemsModalOpen}
        onClose={() => setIsAddItemsModalOpen(false)}
        title={`Agregar Ítems Adicionales a Pedido #${selectedOrder?.id}`}
        size="lg"
      >
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold">Seleccionar Plato para Añadir</label>
            <div className="d-flex flex-column gap-2" style={{ maxHeight: 300, overflowY: 'auto' }}>
              {dishes.filter(d => d.active && d.isAvailableToday).map(d => (
                <div key={d.id} className="p-2 border rounded bg-white d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold fs-7" style={{ color: 'var(--text-primary)' }}>{d.name}</div>
                    <small style={{ color: 'var(--color-brand)', fontWeight: 700 }}>S/ {d.price.toFixed(2)}</small>
                  </div>
                  <button className="btn btn-sm btn-outline-primary" style={{ borderRadius: 6 }} onClick={() => handleAddToAdditionalCart(d)}>
                    + Añadir
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="col-12 col-md-6 border-start">
            <label className="form-label fw-bold">Ítems Adicionales por Enviar</label>
            {additionalCart.length === 0 ? (
              <div className="text-center py-4 text-muted fs-7">Sin adicionales seleccionados.</div>
            ) : (
              <div className="d-flex flex-column gap-2 mb-3">
                {additionalCart.map((item, i) => (
                  <div key={i} className="p-2 border rounded bg-light d-flex justify-content-between align-items-center">
                    <span className="fw-bold fs-7">{item.dish.name} (x{item.quantity})</span>
                    <span className="fw-bold" style={{ color: 'var(--color-brand)' }}>S/ {(item.dish.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            <button
              className="btn-brand btn w-100 fw-semibold"
              style={{ borderRadius: 8 }}
              disabled={additionalCart.length === 0}
              onClick={handleSendAdditionalItems}
            >
              Enviar Adicionales a Cocina
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancelar Pedido (Supervisión Administrativa)"
      >
        <div className="mb-4">
          <label className="form-label">Motivo de Cancelación *</label>
          <textarea
            className="form-control"
            style={{ borderRadius: 8 }}
            rows={3}
            placeholder="Ej. Solicitud explícita del cliente por demoras..."
            required
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
          ></textarea>
        </div>
        <div className="d-flex justify-content-end gap-2 border-top pt-2">
          <button className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setIsCancelModalOpen(false)}>Cancelar</button>
          <button
            className="btn btn-danger fw-semibold"
            style={{ borderRadius: 8 }}
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

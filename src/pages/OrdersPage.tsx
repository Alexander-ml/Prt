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
import { CustomDropdownSelect } from '../components/common/CustomDropdownSelect';

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
          <div className="btn-group" role="tablist" aria-label="Cambiar vista de pedidos">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'take_order'}
              className={`btn btn-sm fw-semibold ${activeTab === 'take_order' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
              style={{ borderRadius: '8px 0 0 8px' }}
              onClick={() => setActiveTab('take_order')}
            >
              <i className="bi bi-plus-circle me-2"></i>Tomar Pedido
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              className={`btn btn-sm fw-semibold ${activeTab === 'history' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
              style={{ borderRadius: '0 8px 8px 0' }}
              onClick={() => setActiveTab('history')}
            >
              <i className="bi bi-clock-history me-2"></i>Historial
            </button>
          </div>
        }
      />

      {activeTab === 'take_order' ? (
        <div className="row g-4 mb-4">
          {/* Left Cols: Catalog Selection */}
          <div className="col-12 col-lg-7 col-xl-8">
            <SectionCard
              icon="bi-journal-richtext"
              title="Selección de Platos"
              className="h-100 d-flex flex-column"
            >
              <div className="mb-3">
                <SearchBar
                  value={dishSearchQuery}
                  onChange={setDishSearchQuery}
                  placeholder="Buscar plato por nombre..."
                />
              </div>

              <div className="d-flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  className={`btn btn-sm fw-semibold ${selectedDishCategory === 'todas' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                  style={{ borderRadius: 20 }}
                  onClick={() => setSelectedDishCategory('todas')}
                >
                  Todas
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`btn btn-sm fw-semibold ${selectedDishCategory === cat.id ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                    style={{ borderRadius: 20 }}
                    onClick={() => setSelectedDishCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="flex-grow-1 overflow-y-auto" style={{ maxHeight: '560px' }}>
                {filteredDishes.length === 0 ? (
                  <EmptyState
                    icon="bi-search"
                    title="Sin resultados"
                    description="No se encontraron platos que coincidan con la búsqueda o categoría seleccionada."
                  />
                ) : (
                  <div className="row g-2">
                    {filteredDishes.map(dish => (
                      <div key={dish.id} className="col-12 col-md-6">
                        <div
                          className="p-2 border rounded-3 bg-white d-flex justify-content-between align-items-center h-100"
                          style={{ opacity: dish.isAvailableToday ? 1 : 0.6 }}
                        >
                          <div>
                            <div className="fw-bold d-flex align-items-center gap-2" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              {dish.name}
                              {!dish.isAvailableToday && <Badge status="AGOTADO" variant="danger" />}
                            </div>
                            <small style={{ color: 'var(--color-brand)', fontWeight: 700 }}>S/ {dish.price.toFixed(2)}</small>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary flex-shrink-0"
                            style={{ borderRadius: 6 }}
                            disabled={!dish.isAvailableToday}
                            onClick={() => handleAddToCart(dish)}
                          >
                            <i className="bi bi-plus-lg me-1"></i>Añadir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Right Cols: Comanda Builder */}
          <div className="col-12 col-lg-5 col-xl-4">
            <SectionCard
              icon="bi-receipt"
              title="Comanda de Mesa"
              className="h-100 d-flex flex-column"
              actions={
                cartItems.length > 0 ? (
                  <span className="badge bg-primary rounded-pill">
                    {cartItems.reduce((sum, i) => sum + i.quantity, 0)} ítem(s)
                  </span>
                ) : undefined
              }
            >
              <div className="border-bottom pb-3 mb-3">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <label className="form-label fw-bold mb-0" id="mesaSelectLabel">
                    1. Seleccionar Mesa
                  </label>
                  {selectedTableObj && (
                    <Badge
                      status={selectedTableObj.status.toUpperCase()}
                      variant={statusMeta[selectedTableObj.status]?.badgeVariant ?? 'secondary'}
                      icon={statusMeta[selectedTableObj.status]?.icon}
                    />
                  )}
                </div>
                {/* Select de estado: agrupado por disponibilidad, color semántico por grupo */}
                <CustomDropdownSelect
                  id="mesaSelect"
                  labelId="mesaSelectLabel"
                  value={selectedTableId}
                  onChange={setSelectedTableId}
                  placeholder="Elija mesa..."
                  size="lg"
                  required
                  groups={Object.entries(statusMeta)
                    .sort((a, b) => a[1].order - b[1].order)
                    .map(([status, meta]) => ({
                      label: `${meta.label} (${(groupedTables[status] ?? []).length})`,
                      icon: meta.icon,
                      options: (groupedTables[status] ?? []).map(t => ({
                        value: t.id,
                        label: `Mesa #${t.number} — ${t.areaName}`,
                        description: `${t.capacity} personas`,
                        icon: meta.icon,
                        colorVariant: meta.badgeVariant,
                      })),
                    }))
                    .filter(g => g.options.length > 0)}
                />
                {selectedTableObj && (
                  <div className="form-text mt-2 mb-0">
                    <i className="bi bi-geo-alt me-1" aria-hidden="true"></i>
                    {selectedTableObj.areaName}
                    {' · '}
                    <i className="bi bi-people-fill me-1" aria-hidden="true"></i>
                    Capacidad para {selectedTableObj.capacity} personas
                  </div>
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
                      <div key={idx} className="rounded-3 border bg-white shadow-sm" style={{ padding: '0.65rem' }}>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="fw-bold" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {item.dish.name}
                          </span>
                          <span className="fw-bold" style={{ fontSize: '0.85rem', color: 'var(--color-brand)' }}>
                            S/ {(item.dish.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        {item.observation && (
                          <div className="p-2 rounded mb-2" style={{ background: 'var(--color-amber-bg)', color: 'var(--color-amber-text)', fontSize: '0.75rem' }}>
                            <i className="bi bi-chat-left-text-fill me-1"></i> Obs: {item.observation}
                          </div>
                        )}
                        <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                          {/* Quantity Controls */}
                          <div className="d-flex align-items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Disminuir cantidad de ${item.dish.name}`}
                              className="btn btn-sm btn-light border px-2 py-0 fw-bold"
                              onClick={() => handleUpdateCartQuantity(idx, -1)}
                            >
                              -
                            </button>
                            <span className="fw-bold" style={{ fontSize: '0.85rem', minWidth: 16, textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Aumentar cantidad de ${item.dish.name}`}
                              className="btn btn-sm btn-light border px-2 py-0 fw-bold"
                              onClick={() => handleUpdateCartQuantity(idx, 1)}
                            >
                              +
                            </button>
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-warning p-0"
                              title="Registrar observación"
                              onClick={() => {
                                setObsIndex(idx);
                                setTempObs(item.observation);
                                setIsObsModalOpen(true);
                              }}
                            >
                              <i className="bi bi-pencil me-1"></i>Obs
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-danger p-0"
                              title="Eliminar plato"
                              aria-label={`Eliminar ${item.dish.name} de la comanda`}
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
                  <span className="fw-bold" style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>S/ {cartSubtotal.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  className="btn-brand btn w-100 fw-bold"
                  style={{ borderRadius: 10, fontSize: '0.95rem', paddingTop: '0.65rem', paddingBottom: '0.65rem' }}
                  disabled={cartItems.length === 0 || !selectedTableId}
                  onClick={handleConfirmAndSendOrder}
                >
                  <i className="bi bi-send-fill me-2"></i> Confirmar y Enviar a Cocina
                </button>
                {(cartItems.length === 0 || !selectedTableId) && (
                  <small className="d-block text-center mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {!selectedTableId ? 'Selecciona una mesa para continuar.' : 'Agrega al menos un plato a la comanda.'}
                  </small>
                )}
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
                  <div className="d-flex gap-2">
                    {selectedOrder.status !== 'cerrado' && selectedOrder.status !== 'cancelado' && (
                      <button
                        type="button"
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
                        type="button"
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
      )}

      {/* Observation Modal */}
      <Modal
        isOpen={isObsModalOpen}
        onClose={() => setIsObsModalOpen(false)}
        title="Registrar Observación Especial"
      >
        <div className="mb-4">
          <label className="form-label" htmlFor="obsInput">Instrucciones para Cocina</label>
          <input
            id="obsInput"
            type="text"
            className="form-control"
            style={{ borderRadius: 8 }}
            placeholder="Ej. Sin picante, término medio, sal reducida..."
            value={tempObs}
            onChange={e => setTempObs(e.target.value)}
            autoFocus
          />
        </div>
        <div className="d-flex justify-content-end gap-2 border-top pt-3">
          <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setIsObsModalOpen(false)}>
            Cancelar
          </button>
          <button type="button" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }} onClick={handleSaveObservation}>
            Guardar Observación
          </button>
        </div>
      </Modal>

      {/* Additional Items Modal */}
      <Modal
        isOpen={isAddItemsModalOpen}
        onClose={() => setIsAddItemsModalOpen(false)}
        title={`Agregar Ítems Adicionales a Pedido #${selectedOrder?.id}`}
        size="lg"
      >
        <div className="row g-4 mb-3">
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold">Seleccionar Plato para Añadir</label>
            <div className="d-flex flex-column gap-2" style={{ maxHeight: 300, overflowY: 'auto' }}>
              {dishes.filter(d => d.active && d.isAvailableToday).map(d => (
                <div key={d.id} className="p-2 border rounded-3 bg-white d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{d.name}</div>
                    <small style={{ color: 'var(--color-brand)', fontWeight: 700 }}>S/ {d.price.toFixed(2)}</small>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary flex-shrink-0"
                    style={{ borderRadius: 6 }}
                    onClick={() => handleAddToAdditionalCart(d)}
                  >
                    <i className="bi bi-plus-lg me-1"></i>Añadir
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="col-12 col-md-6 border-start ps-md-4">
            <label className="form-label fw-bold">Ítems Adicionales por Enviar</label>
            {additionalCart.length === 0 ? (
              <div className="text-center py-4" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <i className="bi bi-cart d-block mb-1" style={{ fontSize: '1.5rem', color: '#94a3b8' }}></i>
                Sin adicionales seleccionados.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2 mb-3">
                {additionalCart.map((item, i) => (
                  <div key={i} className="p-2 border rounded-3 bg-light d-flex justify-content-between align-items-center">
                    <span className="fw-bold" style={{ fontSize: '0.8rem' }}>{item.dish.name} (x{item.quantity})</span>
                    <span className="fw-bold" style={{ color: 'var(--color-brand)' }}>S/ {(item.dish.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              className="btn-brand btn w-100 fw-semibold"
              style={{ borderRadius: 8 }}
              disabled={additionalCart.length === 0}
              onClick={handleSendAdditionalItems}
            >
              <i className="bi bi-send-fill me-2"></i>Enviar Adicionales a Cocina
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
          <label className="form-label" htmlFor="cancelReason">Motivo de Cancelación *</label>
          <textarea
            id="cancelReason"
            className="form-control"
            style={{ borderRadius: 8 }}
            rows={3}
            placeholder="Ej. Solicitud explícita del cliente por demoras..."
            required
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
          ></textarea>
        </div>
        <div className="d-flex justify-content-end gap-2 border-top pt-3">
          <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setIsCancelModalOpen(false)}>
            Cancelar
          </button>
          <button
            type="button"
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
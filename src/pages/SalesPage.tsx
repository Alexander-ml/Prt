import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { PaymentMethod, Sale, GuestBillSplit } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { EmptyState } from '../components/common/EmptyState';
import { StatCard } from '../components/common/StatCard';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { CustomDropdownSelect } from '../components/common/CustomDropdownSelect';

export const SalesPage: React.FC = () => {
  const {
    orders,
    sales,
    promotions,
    taxes,
    processSaleBilling,
    cancelSale,
    currentRole,
  } = useApp();

  const location = useLocation();
  const isAdmin = currentRole === 'Administrador';
  const [activeTab, setActiveTab] = useState<'billing' | 'history'>('billing');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tarjeta');
  const [selectedPromoId, setSelectedPromoId] = useState<string>('');
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitCount, setSplitCount] = useState<number>(2);
  const [splits, setSplits] = useState<GuestBillSplit[]>([]);
  const [viewReceiptSale, setViewReceiptSale] = useState<Sale | null>(null);
  const [cancelSaleObj, setCancelSaleObj] = useState<Sale | null>(null);
  const [filterDate, setFilterDate] = useState<string>('');

  useEffect(() => {
    if (location.state?.billTableId) {
      const order = orders.find(o => o.tableId === location.state.billTableId && o.status !== 'cerrado');
      if (order) setSelectedOrderId(order.id);
    } else if (orders.length > 0 && !selectedOrderId) {
      const open = orders.find(o => o.status !== 'cerrado');
      if (open) setSelectedOrderId(open.id);
    }
  }, [location.state, orders, selectedOrderId]);

  const currentOrder = orders.find(o => o.id === selectedOrderId);
  const subtotal = currentOrder
    ? currentOrder.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    : 0;

  const activePromo = promotions.find(p => p.id === selectedPromoId && p.active);
  const discountAmount = activePromo ? (subtotal * activePromo.discountPercentage) / 100 : 0;
  const activeIgv = taxes.find(t => t.active && t.name.includes('IGV'));
  const igvPercent = activeIgv ? activeIgv.percentage : 18;
  const taxAmount = ((subtotal - discountAmount) * igvPercent) / 100;
  const totalAmount = subtotal - discountAmount + taxAmount;

  const handleOpenSplitModal = () => {
    if (!currentOrder) return;
    const perGuest = totalAmount / splitCount;
    setSplits(
      Array.from({ length: splitCount }, (_, i) => ({
        id: `split-${i + 1}`,
        guestName: `Comensal ${i + 1}`,
        items: [],
        totalAmount: perGuest,
        paid: false,
      }))
    );
    setIsSplitModalOpen(true);
  };

  const handleUpdateSplitCount = (count: number) => {
    setSplitCount(count);
    const perGuest = totalAmount / count;
    setSplits(
      Array.from({ length: count }, (_, i) => ({
        id: `split-${i + 1}`,
        guestName: `Comensal ${i + 1}`,
        items: [],
        totalAmount: perGuest,
        paid: false,
      }))
    );
  };

  const handleConfirmCheckout = () => {
    if (!currentOrder) return;
    processSaleBilling(
      currentOrder.id,
      paymentMethod,
      selectedPromoId || undefined,
      splits.length > 0 ? splits : undefined
    );
    setSelectedOrderId('');
    setSplits([]);
  };

  // History & stats
  const filteredSales = sales.filter(s => !filterDate || s.closedAt.includes(filterDate));
  const validSales = sales.filter(s => !s.isCancelled);
  const totalSalesSum = validSales.reduce((acc, s) => acc + s.total, 0);
  const averageTicket = validSales.length > 0 ? totalSalesSum / validSales.length : 0;

  const dishSalesMap: Record<string, number> = {};
  validSales.forEach(s => {
    s.items.forEach(i => {
      dishSalesMap[i.dishName] = (dishSalesMap[i.dishName] || 0) + i.quantity;
    });
  });
  const topDishes = Object.entries(dishSalesMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
  <div className="container-fluid p-0">
    <PageHeader
      icon="bi-cash-coin"
      title="Ventas, Cobro y Facturación"
      subtitle="Resumen de cuenta, descuentos, división de pago, comprobantes y reportes de ventas."
      actions={
        <div className="btn-group" role="tablist" aria-label="Cambiar vista de ventas">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'billing'}
            className={`btn btn-sm fw-semibold ${activeTab === 'billing' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
            style={{ borderRadius: '8px 0 0 8px' }}
            onClick={() => setActiveTab('billing')}
          >
            <i className="bi bi-credit-card me-2"></i>Cobro
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'history'}
            className={`btn btn-sm fw-semibold ${activeTab === 'history' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
            style={{ borderRadius: '0 8px 8px 0' }}
            onClick={() => setActiveTab('history')}
          >
            <i className="bi bi-graph-up me-2"></i>Historial
          </button>
        </div>
      }
    />

    {activeTab === 'billing' ? (
      <div className="row g-4">
        {/* Left: Account Summary */}
        <div className="col-12 col-lg-7">
          <SectionCard icon="bi-receipt" title="1. Resumen de Cuenta de Mesa">
            <div className="mb-4">
              <label id="mesaLiquidarLabel" className="form-label fw-bold">Mesa a liquidar</label>
              {(() => {
                const activeOrders = orders.filter(o => o.status !== 'cerrado' && o.status !== 'cancelado');
                const statusColorMap: Record<string, string> = {
                  en_preparacion: 'warning',
                  listo: 'success',
                  pendiente: 'secondary',
                };
                const tableOptions = activeOrders.map(o => ({
                  value: o.id,
                  label: `Mesa #${o.tableNumber} — ${o.areaName}`,
                  description: `${o.waiterName} · ${o.items.length} plato${o.items.length !== 1 ? 's' : ''} · Estado: ${o.status.replace('_',' ')}`,
                  icon: 'bi-table',
                  colorVariant: statusColorMap[o.status] ?? 'primary',
                }));
                return (
                  <CustomDropdownSelect
                    id="mesaLiquidar"
                    labelId="mesaLiquidarLabel"
                    value={selectedOrderId}
                    onChange={setSelectedOrderId}
                    placeholder="Seleccione una mesa con pedido activo…"
                    options={[
                      { value: '', label: 'Seleccione una mesa con pedido activo…', disabled: true },
                      ...tableOptions,
                    ]}
                    size="lg"
                  />
                );
              })()}
              {orders.filter(o => o.status !== 'cerrado' && o.status !== 'cancelado').length === 0 && (
                <small className="d-block mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  <i className="bi bi-info-circle me-1"></i>No hay mesas con pedidos activos por cobrar.
                </small>
              )}
            </div>

            {currentOrder ? (
              <>
                <div className="custom-table-container mb-4" style={{ overflow: 'auto' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Plato</th>
                        <th>Cant.</th>
                        <th>Precio Un.</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrder.items.map(item => (
                        <tr key={item.id}>
                          <td><span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{item.dishName}</span></td>
                          <td><span className="fw-bold">{item.quantity}</span></td>
                          <td>S/ {item.price.toFixed(2)}</td>
                          <td className="text-end fw-bold" style={{ color: 'var(--text-primary)' }}>
                            S/ {(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Promo Selector */}
                <div className="p-3 rounded-3 mb-3" style={{ background: 'var(--color-brand-light)', border: '1px solid var(--color-brand-subtle)' }}>
                  <label id="promoSelectLabel" className="form-label fw-bold" style={{ color: 'var(--color-brand)' }}>
                    <i className="bi bi-tag-fill me-1"></i>
                    Aplicar Promoción Vigente
                  </label>
                  <CustomDropdownSelect
                    id="promoSelect"
                    labelId="promoSelectLabel"
                    value={selectedPromoId}
                    onChange={setSelectedPromoId}
                    placeholder="Sin promoción aplicada"
                    disabled={promotions.filter(p => p.active).length === 0}
                    options={[
                      { value: '', label: 'Sin promoción aplicada', icon: 'bi-x-circle', colorVariant: 'secondary' },
                      ...promotions.filter(p => p.active).map(p => ({
                        value: p.id,
                        label: `${p.name} — ${p.discountPercentage}% OFF`,
                        description: `Código: ${p.code}`,
                        icon: 'bi-ticket-perforated-fill',
                        colorVariant: 'success',
                      }))
                    ]}
                  />
                  {promotions.filter(p => p.active).length === 0 && (
                    <small className="d-block mt-2" style={{ color: 'var(--color-brand)', fontSize: '0.75rem', opacity: 0.8 }}>
                      No hay promociones vigentes en este momento.
                    </small>
                  )}
                </div>

                {/* Split Bill RF-58 */}
                <div
                  className="p-3 rounded-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2"
                  style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}
                >
                  <div>
                    <div className="fw-bold" style={{ fontSize: '0.875rem', color: '#5b21b6' }}>
                      <i className="bi bi-people-fill me-1"></i>División de Cuenta
                    </div>
                    <small style={{ color: '#7c3aed' }}>
                      Dividir en {splitCount} partes iguales — S/ {(totalAmount / splitCount).toFixed(2)} c/u
                    </small>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm fw-semibold flex-shrink-0"
                    style={{ borderRadius: 8 }}
                    onClick={handleOpenSplitModal}
                  >
                    <i className="bi bi-people-fill me-1"></i> Dividir
                  </button>
                </div>
              </>
            ) : (
              <EmptyState
                icon="bi-receipt"
                title="Sin mesa seleccionada"
                description="Seleccione una mesa del desplegable para generar el resumen de cuenta."
              />
            )}
          </SectionCard>
        </div>

        {/* Right: Total & Payment */}
        <div className="col-12 col-lg-5">
          <SectionCard icon="bi-wallet2" title="2. Detalle de Cobro y Cierre">
            <div className="d-flex flex-column gap-2 mb-4">
              <div className="d-flex justify-content-between" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <span>Subtotal consumo:</span>
                <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>S/ {subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="d-flex justify-content-between" style={{ fontSize: '0.875rem', color: '#059669' }}>
                  <span><i className="bi bi-tag-fill me-1"></i>Descuento ({activePromo?.discountPercentage}%):</span>
                  <span className="fw-bold">− S/ {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <span>IGV ({igvPercent}%):</span>
                <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>S/ {taxAmount.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-baseline pt-2 mt-1" style={{ borderTop: '2px solid var(--border-color)' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>TOTAL A COBRAR:</span>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-brand)', letterSpacing: '-0.03em' }}>
                  S/ {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method RF-59 */}
            <fieldset className="mb-4 border-0 p-0">
              <legend className="form-label fw-bold h6">Forma de Pago</legend>
              <div className="d-flex gap-2">
                {([
                  { id: 'efectivo', icon: 'bi-cash', label: 'Efectivo' },
                  { id: 'tarjeta',  icon: 'bi-credit-card', label: 'Tarjeta' },
                  { id: 'mixto',    icon: 'bi-wallet2', label: 'Mixto' },
                ] as { id: PaymentMethod; icon: string; label: string }[]).map(pm => (
                  <button
                    key={pm.id}
                    type="button"
                    aria-pressed={paymentMethod === pm.id}
                    className={`position-relative btn flex-grow-1 ${paymentMethod === pm.id ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                    style={{ borderRadius: 8, padding: '0.625rem 0.5rem', fontSize: '0.8rem', fontWeight: 700 }}
                    onClick={() => setPaymentMethod(pm.id)}
                  >
                    {paymentMethod === pm.id && (
                      <i className="bi bi-check-circle-fill position-absolute top-0 end-0 translate-middle text-white bg-primary rounded-circle" style={{ fontSize: '0.9rem' }}></i>
                    )}
                    <i className={`bi ${pm.icon} d-block mb-1`} style={{ fontSize: '1.25rem' }}></i>
                    {pm.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Confirm RF-60 */}
            <button
              type="button"
              className="btn w-100 fw-bold"
              style={{
                background: currentOrder ? 'linear-gradient(135deg, #059669, #10b981)' : '#e2e8f0',
                color: currentOrder ? '#fff' : '#94a3b8',
                borderRadius: 10, padding: '0.75rem',
                fontSize: '1rem', border: 'none',
                boxShadow: currentOrder ? '0 4px 12px rgba(5,150,105,0.3)' : 'none',
                transition: 'box-shadow 0.15s ease',
              }}
              disabled={!currentOrder}
              onClick={handleConfirmCheckout}
            >
              <i className="bi bi-check-circle-fill me-2"></i>
              Confirmar Cierre de Venta
            </button>
            {!currentOrder && (
              <small className="d-block text-center mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Seleccione una mesa para habilitar el cobro.
              </small>
            )}
          </SectionCard>
        </div>
      </div>
    ) : (
      /* History & Reports View */
      <div className="d-flex flex-column gap-4">
        {/* Stats KPIs RF-63 */}
        <div className="row g-3 stagger-children">
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard
              title="Total Ventas Consolidadas"
              value={`S/ ${totalSalesSum.toFixed(2)}`}
              subtitle={`${validSales.length} transacciones registradas`}
              icon="bi-cash-stack"
              colorTheme="emerald"
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard
              title="Ticket Promedio por Mesa"
              value={`S/ ${averageTicket.toFixed(2)}`}
              subtitle="Consumo medio por comanda"
              icon="bi-receipt"
              colorTheme="indigo"
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard
              title="Ventas Anuladas"
              value={sales.filter(s => s.isCancelled).length}
              subtitle="Comprobantes cancelados"
              icon="bi-x-circle"
              colorTheme="rose"
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard
              title="Platos Más Vendidos"
              value={topDishes[0]?.[0] ?? '—'}
              subtitle={topDishes[0] ? `${topDishes[0][1]} unidades` : 'Sin datos'}
              icon="bi-star-fill"
              colorTheme="amber"
            />
          </div>
        </div>

        {/* Top dishes RF-63 */}
        {topDishes.length > 0 && (
          <SectionCard icon="bi-trophy-fill" title="Platos Más Vendidos">
            <div className="d-flex flex-column gap-2">
              {topDishes.map(([dish, qty], i) => {
                const max = topDishes[0][1];
                const pct = Math.round((qty / max) * 100);
                return (
                  <div key={i} className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: i === 0 ? '#fef3c7' : 'var(--surface-muted)',
                        color: i === 0 ? '#d97706' : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '0.75rem', flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="d-flex justify-content-between mb-1">
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {dish}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {qty} un.
                        </span>
                      </div>
                      <div className="progress" style={{ height: 6, borderRadius: 99 }}>
                        <div
                          className="progress-bar"
                          style={{
                            width: `${pct}%`,
                            background: i === 0 ? '#d97706' : i === 1 ? '#64748b' : '#cbd5e1',
                            borderRadius: 99,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Filter + Export */}
        <SectionCard
          icon="bi-funnel"
          title="Historial de Ventas"
          actions={
            isAdmin && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary fw-semibold"
                style={{ borderRadius: 8, fontSize: '0.78rem' }}
                onClick={() => alert('Reporte exportado en Excel/PDF.')}
              >
                <i className="bi bi-download me-1"></i> Exportar
              </button>
            )
          }
        >
          <div className="d-flex align-items-center justify-content-between gap-3 mb-4 flex-wrap">
            <div className="d-flex align-items-center gap-2">
              <label className="form-label mb-0" htmlFor="filterDate">Filtrar por fecha:</label>
              <input
                id="filterDate"
                type="date"
                className="form-control form-control-sm"
                style={{ borderRadius: 8, width: 'auto' }}
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
              />
              {filterDate && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-muted p-0"
                  onClick={() => setFilterDate('')}
                >
                  Limpiar
                </button>
              )}
            </div>
            <span className="badge rounded-pill text-bg-light border" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {filteredSales.length} resultado{filteredSales.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="table-responsive-x">
            <table className="custom-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>N° Comprobante</th>
                  <th>Mesa</th>
                  <th>Atendido por</th>
                  <th>Fecha y Hora</th>
                  <th>Forma Pago</th>
                  <th className="text-end">Total</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(sale => (
                  <tr key={sale.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace', fontSize: '0.8rem',
                          fontWeight: 700, color: 'var(--color-brand)',
                        }}
                      >
                        {sale.id}
                      </span>
                    </td>
                    <td className="fw-bold" style={{ color: 'var(--text-primary)' }}>
                      Mesa #{sale.tableNumber}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{sale.waiterName}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{sale.closedAt}</td>
                    <td>
                      <Badge status={sale.paymentMethod.toUpperCase()} variant="secondary" />
                    </td>
                    <td className="text-end fw-bold" style={{ color: 'var(--color-brand)', fontSize: '1rem' }}>
                      S/ {sale.total.toFixed(2)}
                    </td>
                    <td>
                      <Badge
                        status={sale.isCancelled ? 'ANULADA' : 'CERRADA'}
                        variant={sale.isCancelled ? 'danger' : 'success'}
                      />
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        <button
                          type="button"
                          className="btn-icon btn-icon-primary"
                          title="Imprimir Comprobante"
                          aria-label={`Ver comprobante ${sale.id}`}
                          onClick={() => setViewReceiptSale(sale)}
                        >
                          <i className="bi bi-printer-fill"></i>
                        </button>
                        {isAdmin && !sale.isCancelled && (
                          <button
                            type="button"
                            className="btn-icon btn-icon-danger"
                            title="Anular Venta"
                            aria-label={`Anular venta ${sale.id}`}
                            onClick={() => setCancelSaleObj(sale)}
                          >
                            <i className="bi bi-x-circle-fill"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSales.length === 0 && (
              <EmptyState icon="bi-graph-down" title="Sin ventas registradas" description="No hay ventas que coincidan con el filtro de fecha seleccionado." />
            )}
          </div>
        </SectionCard>
      </div>
    )}

    {/* Split Bill Modal */}
    <Modal isOpen={isSplitModalOpen} onClose={() => setIsSplitModalOpen(false)} title="División de Cuenta">
      <div className="mb-3">
        <label className="form-label fw-bold">Número de Comensales</label>
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-outline-secondary"
            style={{ borderRadius: 8, width: 36, height: 36, padding: 0 }}
            disabled={splitCount <= 2}
            aria-label="Reducir número de comensales"
            onClick={() => handleUpdateSplitCount(Math.max(2, splitCount - 1))}
          >
            <i className="bi bi-dash"></i>
          </button>
          <span className="fw-bold fs-4 px-2">{splitCount}</span>
          <button
            type="button"
            className="btn btn-outline-secondary"
            style={{ borderRadius: 8, width: 36, height: 36, padding: 0 }}
            aria-label="Aumentar número de comensales"
            onClick={() => handleUpdateSplitCount(splitCount + 1)}
          >
            <i className="bi bi-plus"></i>
          </button>
          <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Mínimo 2 comensales</small>
        </div>
      </div>
      <div className="d-flex flex-column gap-2 mb-3">
        {splits.map((s, idx) => (
          <div
            key={s.id}
            className="p-2 rounded-3 d-flex align-items-center justify-content-between gap-2"
            style={{ background: 'var(--surface-muted)', border: '1px solid var(--border-color)' }}
          >
            <input
              type="text"
              className="form-control form-control-sm fw-semibold"
              style={{ borderRadius: 6, maxWidth: 180, background: 'white' }}
              value={s.guestName}
              aria-label={`Nombre del comensal ${idx + 1}`}
              onChange={e => {
                const name = e.target.value;
                setSplits(prev => prev.map((sp, i) => (i === idx ? { ...sp, guestName: name } : sp)));
              }}
            />
            <span className="fw-bold flex-shrink-0" style={{ color: 'var(--color-brand)', fontSize: '1.05rem' }}>
              S/ {s.totalAmount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <div className="p-2 rounded-3 d-flex justify-content-between mb-4" style={{ background: 'var(--color-brand-light)', fontSize: '0.8rem' }}>
        <span className="fw-semibold" style={{ color: 'var(--color-brand)' }}>Suma de partes:</span>
        <span className="fw-bold" style={{ color: 'var(--color-brand)' }}>
          S/ {splits.reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)} / S/ {totalAmount.toFixed(2)}
        </span>
      </div>
      <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setIsSplitModalOpen(false)}>
          Cancelar
        </button>
        <button type="button" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }} onClick={() => setIsSplitModalOpen(false)}>
          <i className="bi bi-check-lg me-1"></i>Confirmar División
        </button>
      </div>
    </Modal>

    {/* Receipt Modal RF-61 */}
    {viewReceiptSale && (
      <Modal isOpen={!!viewReceiptSale} onClose={() => setViewReceiptSale(null)} title={`Comprobante ${viewReceiptSale.id}`} size="sm">
        <div
          className="p-3 rounded-3 text-center"
          style={{ fontFamily: 'monospace', background: '#fafafa', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
        >
          <div className="fw-bold mb-0" style={{ fontSize: '1rem' }}>RESTAURANTE GOURMETOS</div>
          <div style={{ color: 'var(--text-muted)' }}>RUC 20601234567</div>
          <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Av. La Mar 1240, Miraflores</div>
          <hr className="my-2" />
          <div className="d-flex justify-content-between">
            <span>TICKET: {viewReceiptSale.id}</span>
            <span>MESA: #{viewReceiptSale.tableNumber}</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 8 }}>{viewReceiptSale.closedAt}</div>
          <hr className="my-2" />
          <div className="d-flex flex-column gap-1 text-start mb-2">
            {viewReceiptSale.items.map((it, idx) => (
              <div key={idx} className="d-flex justify-content-between">
                <span>{it.quantity}x {it.dishName}</span>
                <span>S/ {(it.price * it.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <hr className="my-2" />
          <div className="d-flex justify-content-between"><span>Subtotal:</span><span>S/ {viewReceiptSale.subtotal.toFixed(2)}</span></div>
          <div className="d-flex justify-content-between"><span>IGV (18%):</span><span>S/ {viewReceiptSale.taxAmount.toFixed(2)}</span></div>
          <div className="d-flex justify-content-between fw-bold" style={{ fontSize: '1rem', marginTop: 4 }}>
            <span>TOTAL:</span><span>S/ {viewReceiptSale.total.toFixed(2)}</span>
          </div>
          <hr className="my-2" />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>¡Gracias por su preferencia!</div>
        </div>
        <div className="d-flex justify-content-end gap-2 mt-3 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
          <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setViewReceiptSale(null)}>
            Cerrar
          </button>
          <button type="button" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }} onClick={() => alert('Comprobante enviado a impresora POS.')}>
            <i className="bi bi-printer me-1"></i> Imprimir
          </button>
        </div>
      </Modal>
    )}

    {/* Cancel Sale RF-65 */}
    {cancelSaleObj && (
      <ConfirmModal
        isOpen={!!cancelSaleObj}
        onClose={() => setCancelSaleObj(null)}
        onConfirm={() => cancelSale(cancelSaleObj!.id, 'Cancelación administrativa')}
        title={`Anular Venta ${cancelSaleObj.id}`}
        message={`¿Está seguro de anular la venta por S/ ${cancelSaleObj.total.toFixed(2)}? Esta acción no se puede deshacer.`}
        variant="danger"
        confirmText="Anular Venta"
      />
    )}
  </div>
);
};

import React, { useState } from 'react';
import type { Order, Promotion, SplitMode, GuestBillSplit } from '../../../types';
import { SectionCard } from '../../common/SectionCard';
import { EmptyState } from '../../common/EmptyState';
import { Badge } from '../../common/Badge';
import { CustomDropdownSelect } from '../../common/CustomDropdownSelect';
import { formatMoney } from '../../../utils/money';

interface OrderSummaryCardProps {
  orders: Order[];
  selectedOrderId: string;
  setSelectedOrderId: (val: string) => void;
  currentOrder: Order | undefined;

  promotions: Promotion[];
  selectedPromoId: string;
  setSelectedPromoId: (val: string) => void;
  activePromo: Promotion | undefined;

  splitMode: SplitMode | undefined;
  splitBills: GuestBillSplit[];
  onOpenSplitModal: () => void;
  onClearSplit: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  abierto: 'Abierta',
  en_preparacion: 'En preparación',
  listo: 'Lista para cobrar',
};

const STATUS_BADGE_VARIANT: Record<string, 'warning' | 'success' | 'secondary' | 'primary'> = {
  abierto: 'primary',
  en_preparacion: 'warning',
  listo: 'success',
};

/**
 * OrderSummaryCard — "Mesa y Pedido" (pasos 1-2 del flujo de cobro).
 *
 * Reemplaza la tabla densa de columnas (Plato / Cant. / Precio Un. / Subtotal)
 * por filas al estilo caja registradora: nombre del plato, "cant. x precio" y
 * el subtotal en grande a la derecha, con la observación de cocina debajo si
 * existe (antes no se mostraba). También agrega una franja de contexto de
 * mesa (mesero, área, estado, hora de apertura) — punto #10 del análisis UX.
 *
 * Promoción y división de cuenta ya no están siempre visibles: el cajero no
 * las necesita para el 90% de las cuentas, así que viven detrás de un toggle
 * "Más opciones" y solo se fuerzan visibles si ya están en uso (punto #4).
 */
export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  orders,
  selectedOrderId,
  setSelectedOrderId,
  currentOrder,
  promotions,
  selectedPromoId,
  setSelectedPromoId,
  activePromo,
  splitMode,
  splitBills,
  onOpenSplitModal,
  onClearSplit,
}) => {
  const [extrasOpen, setExtrasOpen] = useState(false);

  const activeOrders = orders.filter(o => o.status !== 'cerrado' && o.status !== 'cancelado');
  const tableOptions = activeOrders.map(o => ({
    value: o.id,
    label: `Mesa #${o.tableNumber} — ${o.areaName}`,
    description: `${o.waiterName} · ${o.items.length} plato${o.items.length !== 1 ? 's' : ''} · Estado: ${o.status.replace('_', ' ')}`,
    icon: 'bi-table',
    colorVariant: o.status === 'listo' ? 'success' : o.status === 'en_preparacion' ? 'warning' : 'primary',
  }));

  const hasActivePromoOrSplit = !!selectedPromoId || !!splitMode;
  const showExtras = extrasOpen || hasActivePromoOrSplit;
  const openHour = currentOrder?.createdAt.split(' ')[1] ?? currentOrder?.createdAt;

  return (
    <SectionCard icon="bi-receipt" title="1. Mesa y Pedido">
      <div className="mb-3">
        <label id="mesaLiquidarLabel" className="form-label fw-bold">Mesa a liquidar</label>
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
        {activeOrders.length === 0 && (
          <small className="d-block mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <i className="bi bi-info-circle me-1"></i>No hay mesas con pedidos activos por cobrar.
          </small>
        )}
      </div>

      {currentOrder ? (
        <>
          {/* Franja de contexto — punto #10: da el mismo vistazo rápido que tendría un cajero real */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            <Badge status={STATUS_LABEL[currentOrder.status] ?? currentOrder.status} variant={STATUS_BADGE_VARIANT[currentOrder.status] ?? 'secondary'} icon="bi-circle-fill" />
            <Badge status={currentOrder.waiterName} variant="secondary" icon="bi-person-badge" />
            <Badge status={currentOrder.areaName} variant="secondary" icon="bi-geo-alt" />
            {openHour && <Badge status={`Desde ${openHour}`} variant="secondary" icon="bi-clock" />}
          </div>

          {/* Pedido — filas estilo caja registradora, no tabla de datos */}
          <div className="rounded-3 mb-3" style={{ border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            {currentOrder.items.map((item, idx) => (
              <div
                key={item.id}
                className="d-flex align-items-start justify-content-between gap-2 px-3 py-2"
                style={{
                  borderTop: idx === 0 ? 'none' : '1px solid var(--border-color)',
                  background: idx % 2 === 1 ? 'var(--surface-muted)' : 'transparent',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div className="fw-semibold text-truncate" style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {item.dishName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {item.quantity} × {formatMoney(item.price)}
                  </div>
                  {item.observation && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-amber-text)' }}>
                      <i className="bi bi-pencil-fill me-1"></i>{item.observation}
                    </div>
                  )}
                </div>
                <div className="fw-bold flex-shrink-0" style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                  {formatMoney(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Toggle de opciones adicionales — punto #4 */}
          <button
            type="button"
            className="btn btn-sm w-100 d-flex align-items-center justify-content-between px-3"
            style={{ borderRadius: 8, border: '1px dashed var(--border-color)', background: 'transparent', color: 'var(--text-muted)' }}
            onClick={() => setExtrasOpen(o => !o)}
            aria-expanded={showExtras}
          >
            <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>
              <i className="bi bi-sliders me-1"></i>
              Promoción y división de cuenta
              {hasActivePromoOrSplit && <span className="ms-1" style={{ color: 'var(--color-emerald)' }}>· en uso</span>}
            </span>
            <i className={`bi ${showExtras ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
          </button>

          {showExtras && (
            <div className="d-flex flex-column gap-2 mt-2">
              {/* Promo Selector */}
              <div className="p-3 rounded-3" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border-color)' }}>
                <label id="promoSelectLabel" className="form-label fw-bold" style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  <i className="bi bi-tag-fill me-1" style={{ color: 'var(--color-brand)' }}></i>
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
                    })),
                  ]}
                />
                {promotions.filter(p => p.active).length === 0 && (
                  <small className="d-block mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    No hay promociones vigentes en este momento.
                  </small>
                )}
                {activePromo && (
                  <small className="d-block mt-2 fw-semibold" style={{ color: 'var(--color-emerald-text)', fontSize: '0.75rem' }}>
                    <i className="bi bi-check-circle-fill me-1"></i>{activePromo.discountPercentage}% de descuento aplicado.
                  </small>
                )}
              </div>

              {/* Split Bill */}
              <div
                className="p-3 rounded-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2"
                style={{ background: 'var(--surface-muted)', border: '1px solid var(--border-color)' }}
              >
                <div style={{ minWidth: 0 }}>
                  <div className="fw-bold" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    <i className="bi bi-people-fill me-1" style={{ color: 'var(--color-brand)' }}></i>División de Cuenta
                  </div>
                  <small style={{ color: 'var(--text-muted)' }}>
                    {splitMode
                      ? `Dividida en ${splitBills.length} partes (${splitMode === 'equitativo' ? 'iguales' : 'por platos'})`
                      : 'La cuenta se cobra completa a menos que la divida'}
                  </small>
                </div>
                <div className="d-flex gap-2 flex-shrink-0">
                  {splitMode && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm fw-semibold bg-white"
                      style={{ borderRadius: 8, minHeight: 38 }}
                      onClick={onClearSplit}
                    >
                      Quitar
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm fw-semibold"
                    style={{ borderRadius: 8, minHeight: 38 }}
                    onClick={onOpenSplitModal}
                  >
                    <i className="bi bi-people-fill me-1"></i> {splitMode ? 'Editar' : 'Dividir'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon="bi-receipt"
          title="Sin mesa seleccionada"
          description="Seleccione una mesa del desplegable para generar el resumen de cuenta."
        />
      )}
    </SectionCard>
  );
};
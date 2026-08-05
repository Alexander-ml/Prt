import React from 'react';
import type { Table, Order } from '../../types';
import { TABLE_STATUS_META } from './tableStatusMeta';

interface TableCardProps {
  table: Table;
  activeOrder?: Order;
  onClick: () => void;
}

/**
 * TableCard — Representa una mesa dentro del plano de sala (RF-32).
 *
 * Reutiliza el mismo lenguaje visual que el mini-plano de `DashboardPage`
 * (clases `.table-card`, `.status-{estado}`, `.table-status-pill` del
 * design system en custom.css) en lugar del `card` de Bootstrap genérico
 * que usaba la versión anterior. Esto unifica cómo se ve "una mesa" en
 * cualquier parte del sistema, cambiando solo la densidad de información
 * según el contexto (compacta en el Dashboard, completa aquí).
 */
export const TableCard: React.FC<TableCardProps> = ({ table, activeOrder, onClick }) => {
  const meta = TABLE_STATUS_META[table.status];

  return (
    <div
      className={`table-card status-${table.status} h-100`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Mesa ${table.number}, área ${table.areaName}, estado ${meta.label}`}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div style={{ minWidth: 0 }}>
        <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
          <span className="fw-extrabold fs-4" style={{ color: 'var(--text-primary)', lineHeight: 1 }}>
            Mesa #{table.number}
          </span>
          <span className="table-status-pill d-inline-flex align-items-center gap-1 flex-shrink-0">
            <i className={`bi ${meta.icon}`} aria-hidden="true"></i>
            {meta.label}
          </span>
        </div>

        <div
          className="d-flex flex-wrap align-items-center gap-2 mb-2"
          style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
        >
          <span className="text-truncate">
            <i className="bi bi-geo-alt me-1" aria-hidden="true"></i>
            {table.areaName}
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-nowrap">
            <i className="bi bi-people me-1" aria-hidden="true"></i>
            {table.capacity} pers.
          </span>
        </div>

        {table.joinedWith && table.joinedWith.length > 0 && (
          <span
            className="d-inline-flex align-items-center gap-1 text-truncate mb-2"
            style={{
              maxWidth: '100%',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-brand-light)',
              color: 'var(--color-brand)',
            }}
          >
            <i className="bi bi-link-45deg" aria-hidden="true"></i>
            Unida con: {table.joinedWith.join(', ')}
          </span>
        )}

        {table.status === 'reservada' && (
          <div
            className="d-flex align-items-center gap-2 mb-2"
            style={{
              background: 'var(--color-amber-bg)',
              border: '1px solid #fcd34d',
              borderRadius: 'var(--radius-sm)',
              padding: '0.45rem 0.65rem',
              fontSize: '0.78rem',
              minWidth: 0,
            }}
          >
            <i className="bi bi-bookmark-star-fill flex-shrink-0" style={{ color: 'var(--color-amber)' }} aria-hidden="true"></i>
            <span className="text-truncate" style={{ color: 'var(--color-amber-text)' }}>
              <strong>{table.reservationName}</strong> · {table.reservationTime}
            </span>
          </div>
        )}

        {table.status === 'ocupada' && activeOrder && (
          <div
            className="mb-2"
            style={{
              background: 'var(--surface-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem 0.65rem',
            }}
          >
            <div className="d-flex align-items-center justify-content-between gap-2" style={{ fontSize: '0.8rem' }}>
              <span className="fw-bold text-truncate" style={{ color: 'var(--text-primary)' }}>
                Pedido #{activeOrder.id.slice(-4)}
              </span>
              <span className="fw-bold flex-shrink-0" style={{ color: 'var(--color-brand)' }}>
                {activeOrder.items.length} platos
              </span>
            </div>
            <div className="text-truncate" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {activeOrder.waiterName}
            </div>
          </div>
        )}
      </div>

      <div
        className="d-flex align-items-center justify-content-between pt-2 mt-2 border-top"
        style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderColor: 'var(--border-muted)' }}
      >
        <span>Clic para opciones</span>
        <i className="bi bi-three-dots-vertical" aria-hidden="true"></i>
      </div>
    </div>
  );
};
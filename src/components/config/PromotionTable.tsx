import React from 'react';
import type { Promotion } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import { PROMOTION_TYPE_META } from './configMeta';

interface PromotionTableProps {
  promotions: Promotion[];
  isAdmin: boolean;
  onEdit: (promotion: Promotion) => void;
  onToggleActive: (promotion: Promotion) => void;
}

/**
 * PromotionTable — Tabla de promociones y descuentos vigentes,
 * presentacional pura. No recibe nada de Impuestos ni de Datos del Local
 * (Interface Segregation) — solo lo necesario para listar promociones y
 * disparar edición/activación. La columna "Alcance" lee `PROMOTION_TYPE_META`
 * en vez de un ternario manual, así que un alcance nuevo se ve correcto acá
 * sin tocar este componente. Sin acción de "Eliminar" a propósito: no se
 * debe poder borrar una promoción que ya se usó en ventas históricas.
 */
export const PromotionTable: React.FC<PromotionTableProps> = ({ promotions, isAdmin, onEdit, onToggleActive }) => {
  return (
    <div className="table-responsive-x">
      <div className="custom-table-container">
        <table className="custom-table" style={{ minWidth: 650 }}>
          <thead>
            <tr>
              <th>Código & Nombre</th>
              <th>Alcance</th>
              <th>Descuento</th>
              <th>Vigencia</th>
              <th>Estado</th>
              {isAdmin && <th className="text-end">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {promotions.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5}>
                  <EmptyState icon="bi-ticket-perforated" title="Aún no hay promociones registradas" />
                </td>
              </tr>
            ) : (
              promotions.map(promo => {
                const typeMeta = PROMOTION_TYPE_META[promo.type];
                return (
                  <tr key={promo.id}>
                    <td>
                      <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{promo.name}</div>
                      <span className="badge font-monospace fs-8" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
                        {promo.code}
                      </span>
                    </td>
                    <td>
                      <span className="fw-semibold d-inline-flex align-items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        <i className={`bi ${typeMeta.icon}`} aria-hidden="true"></i>
                        {typeMeta.needsTarget ? `${typeMeta.label}: ${promo.targetName || ''}` : typeMeta.label}
                      </span>
                    </td>
                    <td>
                      <span className="fw-bold fs-6" style={{ color: 'var(--color-emerald)' }}>{promo.discountPercentage}% OFF</span>
                    </td>
                    <td>
                      <small style={{ color: 'var(--text-muted)' }}>{promo.startDate} al {promo.endDate}</small>
                    </td>
                    <td>
                      <Badge
                        status={promo.active ? 'Vigente' : 'Inactiva'}
                        variant={promo.active ? 'success' : 'secondary'}
                      />
                    </td>
                    {isAdmin && (
                      <td className="text-end">
                        <div className="d-inline-flex gap-1">
                          <button
                            type="button"
                            className="btn-icon btn-icon-primary"
                            title="Editar Promoción"
                            onClick={() => onEdit(promo)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            type="button"
                            className={`btn-icon ${promo.active ? 'btn-icon-danger' : 'btn-icon-success'}`}
                            title={promo.active ? 'Desactivar Promoción' : 'Activar Promoción'}
                            onClick={() => onToggleActive(promo)}
                          >
                            <i className={`bi ${promo.active ? 'bi-slash-circle' : 'bi-check-circle-fill'}`}></i>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
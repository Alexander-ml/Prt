import React from 'react';
import type { Tax, Promotion } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { PROMOTION_TYPE_META } from './configMeta';

interface TaxMobileListProps {
  taxes: Tax[];
  isAdmin: boolean;
  onEdit: (tax: Tax) => void;
}

/**
 * TaxMobileList — Listado móvil de Impuestos, mismo lenguaje visual que
 * `MobileAreaList` (Áreas y Mesas): `article` por impuesto, encabezado con
 * nombre + estado, acciones con texto (no solo íconos). Sin acción de
 * "Eliminar" a propósito, igual que `TaxTable`: no se debe poder borrar un
 * impuesto que ya se usó en ventas históricas.
 */
export const TaxMobileList: React.FC<TaxMobileListProps> = ({ taxes, isAdmin, onEdit }) => {
  if (taxes.length === 0) {
    return <EmptyState icon="bi-percent" title="Aún no hay impuestos configurados" />;
  }

  return (
    <div className="config-mobile-list" aria-label="Impuestos configurados">
      {taxes.map(tax => (
        <article className="config-mobile-item" key={tax.id}>
          <div className="config-mobile-item-heading">
            <div className="min-w-0">
              <h3>{tax.name}</h3>
              <p>{tax.percentage}% sobre el subtotal</p>
            </div>
            <Badge
              status={tax.active ? 'Activo en Ventas' : 'Desactivado'}
              variant={tax.active ? 'success' : 'secondary'}
            />
          </div>
          {isAdmin && (
            <div className="config-mobile-actions">
              <button type="button" className="btn btn-brand-outline" onClick={() => onEdit(tax)}>
                <i className="bi bi-pencil-fill" aria-hidden="true"></i> Editar
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
};

interface PromotionMobileListProps {
  promotions: Promotion[];
  isAdmin: boolean;
  onEdit: (promotion: Promotion) => void;
  onToggleActive: (promotion: Promotion) => void;
}

/**
 * PromotionMobileList — Listado móvil de Promociones, mismo lenguaje
 * visual que `MobileTableList` (Áreas y Mesas): encabezado con
 * nombre/código + estado, datos secundarios (Alcance/Descuento/Vigencia)
 * en `dl`, acciones siempre visibles y con texto. La columna "Alcance"
 * lee `PROMOTION_TYPE_META`, misma fuente de verdad que usa `PromotionTable`.
 */
export const PromotionMobileList: React.FC<PromotionMobileListProps> = ({
  promotions,
  isAdmin,
  onEdit,
  onToggleActive,
}) => {
  if (promotions.length === 0) {
    return <EmptyState icon="bi-ticket-perforated" title="Aún no hay promociones registradas" />;
  }

  return (
    <div className="config-mobile-list" aria-label="Promociones y descuentos vigentes">
      {promotions.map(promo => {
        const typeMeta = PROMOTION_TYPE_META[promo.type];
        return (
          <article className="config-mobile-item" key={promo.id}>
            <div className="config-mobile-item-heading">
              <div className="min-w-0">
                <h3>{promo.name}</h3>
                <p>Código: {promo.code}</p>
              </div>
              <Badge
                status={promo.active ? 'Vigente' : 'Inactiva'}
                variant={promo.active ? 'success' : 'secondary'}
              />
            </div>
            <dl className="config-mobile-details">
              <div>
                <dt>Alcance</dt>
                <dd>{typeMeta.needsTarget ? `${typeMeta.label}: ${promo.targetName || ''}` : typeMeta.label}</dd>
              </div>
              <div><dt>Descuento</dt><dd>{promo.discountPercentage}% OFF</dd></div>
              <div className="config-mobile-details-full"><dt>Vigencia</dt><dd>{promo.startDate} al {promo.endDate}</dd></div>
            </dl>
            {isAdmin && (
              <div className="config-mobile-actions">
                <button type="button" className="btn btn-brand-outline" onClick={() => onEdit(promo)}>
                  <i className="bi bi-pencil-fill" aria-hidden="true"></i> Editar
                </button>
                <button
                  type="button"
                  className={`btn ${promo.active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                  onClick={() => onToggleActive(promo)}
                >
                  <i className={`bi ${promo.active ? 'bi-slash-circle' : 'bi-check-circle-fill'}`} aria-hidden="true"></i>{' '}
                  {promo.active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};

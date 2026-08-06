import React from 'react';
import type { Dish } from '../../types';
import { Badge } from '../common/Badge';
import { KITCHEN_STATION_META } from '../kitchen/kitchenMeta';

interface DishCardProps {
  dish: Dish;
  isAdmin: boolean;
  onEdit: (dish: Dish) => void;
  onToggleActive: (dishId: string) => void;
  /** true si algún insumo de la receta tiene menos stock del que necesita
   *  una porción. Solo informativo — no cambia `isAvailableToday` (ver
   *  diagnóstico de Inventario, sección 4.3 y sección 8). */
  insufficientStock?: boolean;
}

/**
 * DishCard — Tarjeta visual de un plato del catálogo (RF-16).
 * Componente presentacional puro: no lee `useApp()`, no conoce categorías
 * ni maneja estado propio, solo recibe el `dish` a mostrar y los
 * manejadores que ya decidió `DishesView`. El cálculo de "Insumos
 * Insuficientes" vive en `DishesView` (vía `hasInsufficientStock`); esta
 * tarjeta solo recibe el resultado ya calculado.
 *
 * El efecto hover se resuelve de forma declarativa con la clase CSS
 * `.dish-card:hover` (ver custom.css), en vez de mutar `style` a mano con
 * `onMouseEnter`/`onMouseLeave` como hacía la versión anterior.
 */
export const DishCard: React.FC<DishCardProps> = ({ dish, isAdmin, onEdit, onToggleActive, insufficientStock }) => {
  return (
    <div className="dish-card card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
      <div className="position-relative" style={{ height: 150, overflow: 'hidden', background: '#f8fafc' }}>
        <img src={dish.image} alt={dish.name} className="w-100 h-100 object-fit-cover" />
        <div className="position-absolute top-0 start-0 m-2">
          <Badge status={dish.categoryName} variant="dark" />
        </div>
        <div className="position-absolute top-0 end-0 m-2">
          <Badge status={dish.active ? 'Activo' : 'Desactivado'} variant={dish.active ? 'success' : 'secondary'} />
        </div>
        {!dish.isAvailableToday && (
          <div className="position-absolute bottom-0 start-0 end-0 bg-danger bg-opacity-90 text-white text-center py-1 small fw-bold text-uppercase">
            <i className="bi bi-slash-circle-fill me-1" aria-hidden="true"></i>
            Agotado Hoy
          </div>
        )}
      </div>
      <div className="card-body d-flex flex-column p-3">
        <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
          <h3 className="fw-bold mb-0 text-truncate fs-6 text-dark">{dish.name}</h3>
          <span className="fw-bold flex-shrink-0 text-primary fs-6">S/ {dish.price.toFixed(2)}</span>
        </div>
        <p
          className="mb-3 flex-grow-1 small text-muted"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {dish.description}
        </p>

        {/* Datos de cocina (KDS): estación + tiempo de prep., para que el
            admin pueda verificar visualmente lo que configuró sin abrir
            el modal de edición de cada plato. */}
        <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
          {KITCHEN_STATION_META[dish.station] ? (
            <span className={`station-pill kds-station-header-${KITCHEN_STATION_META[dish.station].colorTheme}`}>
              <i className={`bi ${KITCHEN_STATION_META[dish.station].icon}`} aria-hidden="true"></i>
              {KITCHEN_STATION_META[dish.station].label}
            </span>
          ) : (
            <Badge status="Sin Estación" variant="warning" icon="bi-exclamation-triangle-fill" />
          )}
          <small className="text-muted fw-semibold" style={{ fontSize: '0.72rem' }}>
            <i className="bi bi-stopwatch me-1" aria-hidden="true"></i>
            {dish.prepTimeMinutes} min
          </small>
        </div>

        {/* Alérgenos — mismo tono/ícono que Cocina, para no depender del
            modal de edición para verificar qué se configuró. */}
        {dish.allergens && dish.allergens.length > 0 && (
          <div className="kds-allergen-badge" style={{ marginBottom: '0.75rem' }}>
            <i className="bi bi-exclamation-octagon-fill flex-shrink-0" aria-hidden="true"></i>
            <span>Contiene: {dish.allergens.join(', ')}</span>
          </div>
        )}

        {/* Insumos Insuficientes — solo visibilidad (ver diagnóstico de
            Inventario, sección 4.3): no apaga `isAvailableToday`, solo
            avisa que la receta configurada ya no alcanza con el stock
            actual de Inventario. */}
        {insufficientStock && (
          <div
            className="d-flex align-items-start gap-2 fw-semibold"
            style={{
              fontSize: '0.75rem',
              padding: '0.4rem 0.6rem',
              marginBottom: '0.75rem',
              borderRadius: 'var(--radius-sm, 8px)',
              background: 'var(--color-amber-bg)',
              color: 'var(--color-amber-text)',
            }}
          >
            <i className="bi bi-box-seam flex-shrink-0" aria-hidden="true"></i>
            <span>Insumos Insuficientes en Inventario</span>
          </div>
        )}

        <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-auto">
          <div>
            {dish.isAvailableToday && (
              <Badge status="Disponible Hoy" variant="info" icon="bi-check-lg" />
            )}
          </div>
          {isAdmin && (
            <div className="d-flex gap-1">
              <button
                type="button"
                className="btn-icon btn-icon-primary"
                aria-label={`Editar ${dish.name}`}
                onClick={() => onEdit(dish)}
              >
                <i className="bi bi-pencil-fill" aria-hidden="true"></i>
              </button>
              <button
                type="button"
                className={`btn-icon ${dish.active ? 'btn-icon-danger' : 'btn-icon-success'}`}
                aria-label={dish.active ? `Desactivar ${dish.name} del menú` : `Activar ${dish.name} en el menú`}
                onClick={() => onToggleActive(dish.id)}
              >
                <i className={`bi ${dish.active ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} aria-hidden="true"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
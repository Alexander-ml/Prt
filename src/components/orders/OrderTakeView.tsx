import React from 'react';
import type { Dish, Category, Table, ServiceType, UserAccount } from '../../types';
import { SectionCard } from '../common/SectionCard';
import { Badge } from '../common/Badge';
import { SearchBar } from '../common/SearchBar';
import { EmptyState } from '../common/EmptyState';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';
import { SERVICE_TYPE_META } from '../kitchen/kitchenMeta';

type CartLine = { dish: Dish; quantity: number; observation: string };

type StatusMeta = Record<
  string,
  { label: string; icon: string; badgeVariant: 'success' | 'warning' | 'info' | 'danger'; order: number }
>;

interface OrderTakeViewProps {
  dishes: Dish[];
  categories: Category[];
  filteredDishes: Dish[];
  selectedDishCategory: string;
  setSelectedDishCategory: (val: string) => void;
  dishSearchQuery: string;
  setDishSearchQuery: (val: string) => void;
  handleAddToCart: (dish: Dish) => void;

  cartItems: CartLine[];
  handleUpdateCartQuantity: (index: number, delta: number) => void;
  handleRemoveCartItem: (index: number) => void;
  onOpenObservation: (index: number, currentObs: string) => void;

  selectedTableId: string;
  setSelectedTableId: (val: string) => void;
  selectedTableObj: Table | undefined;
  statusMeta: StatusMeta;
  groupedTables: Record<string, Table[]>;

  cartSubtotal: number;
  handleConfirmAndSendOrder: () => void;

  // Tipo de servicio de la comanda (mesa / para_llevar / delivery). La mesa
  // se sigue seleccionando igual para los 3 tipos en esta iteración (ver
  // nota de alcance en el resumen final).
  selectedServiceType: ServiceType;
  setSelectedServiceType: (val: ServiceType) => void;

  // Mesero que atiende — el selector solo se muestra si hay más de uno activo.
  activeWaiters: UserAccount[];
  resolvedWaiterId: string;
  setSelectedWaiterId: (val: string) => void;
}

/**
 * OrderTakeView — Constructor de comanda (RF-39/RF-40/RF-43): selección
 * de mesa, catálogo filtrable de platos y carrito de la comanda en curso.
 * Puramente presentacional: todo el estado vive en OrdersPage.
 */
export const OrderTakeView: React.FC<OrderTakeViewProps> = ({
  dishes,
  categories,
  filteredDishes,
  selectedDishCategory,
  setSelectedDishCategory,
  dishSearchQuery,
  setDishSearchQuery,
  handleAddToCart,
  cartItems,
  handleUpdateCartQuantity,
  handleRemoveCartItem,
  onOpenObservation,
  selectedTableId,
  setSelectedTableId,
  selectedTableObj,
  statusMeta,
  groupedTables,
  cartSubtotal,
  handleConfirmAndSendOrder,
  selectedServiceType,
  setSelectedServiceType,
  activeWaiters,
  resolvedWaiterId,
  setSelectedWaiterId,
}) => {
  const totalActiveDishes = dishes.filter(d => d.active).length;

  const orderSetupFields = (idSuffix: string, includeStepNumber: boolean) => (
    <>
      <div className="border-bottom pb-3 mb-3">
        <div className="row g-3">
          <div className={activeWaiters.length > 1 ? 'col-12 col-sm-6' : 'col-12'}>
            <label className="form-label mb-1" id={`serviceTypeSelectLabel-${idSuffix}`}>
              Tipo de Servicio
            </label>
            <CustomDropdownSelect
              id={`serviceTypeSelect-${idSuffix}`}
              labelId={`serviceTypeSelectLabel-${idSuffix}`}
              value={selectedServiceType}
              onChange={val => setSelectedServiceType(val as ServiceType)}
              size="sm"
              options={(Object.keys(SERVICE_TYPE_META) as ServiceType[]).map(type => ({
                value: type,
                label: SERVICE_TYPE_META[type].label,
                icon: SERVICE_TYPE_META[type].icon,
                colorVariant: 'primary' as const,
              }))}
            />
          </div>
          {activeWaiters.length > 1 && (
            <div className="col-12 col-sm-6">
              <label className="form-label mb-1" id={`waiterSelectLabel-${idSuffix}`}>
                Atendido por
              </label>
              <CustomDropdownSelect
                id={`waiterSelect-${idSuffix}`}
                labelId={`waiterSelectLabel-${idSuffix}`}
                value={resolvedWaiterId}
                onChange={setSelectedWaiterId}
                size="sm"
                options={activeWaiters.map(waiter => ({
                  value: waiter.id,
                  label: waiter.name,
                  icon: 'bi-person-badge-fill',
                  colorVariant: 'secondary' as const,
                }))}
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-bottom pb-3 mb-3">
        <div className="d-flex align-items-center justify-content-between mb-1">
          <label className="form-label mb-0" id={`mesaSelectLabel-${idSuffix}`}>
            {includeStepNumber ? '1. Seleccionar Mesa' : 'Seleccionar Mesa'}
          </label>
          {selectedTableObj && (
            <Badge
              status={selectedTableObj.status.toUpperCase()}
              variant={statusMeta[selectedTableObj.status]?.badgeVariant ?? 'secondary'}
              icon={statusMeta[selectedTableObj.status]?.icon}
            />
          )}
        </div>
        <CustomDropdownSelect
          id={`mesaSelect-${idSuffix}`}
          labelId={`mesaSelectLabel-${idSuffix}`}
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
              options: (groupedTables[status] ?? []).map(table => ({
                value: table.id,
                label: `Mesa #${table.number} . . ${table.areaName}`,
                description: `${table.capacity} personas`,
                icon: meta.icon,
                colorVariant: meta.badgeVariant,
              })),
            }))
            .filter(group => group.options.length > 0)}
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
    </>
  );

  return (
    <>
      <div className="d-sm-none mb-3">
        <SectionCard icon="bi-clipboard-check" title="1. Configurar Comanda" className="order-take-mobile-setup">
          {orderSetupFields('mobile', false)}
        </SectionCard>
      </div>

      <div className="row g-4 mb-4 orders-take-layout">
      {/* Left: Catalog Selection */}
      <div className="col-12 col-lg-7 col-xl-8 order-take-catalog-pane">
        <SectionCard
          icon="bi-journal-richtext"
          title="Selección de Platos"
          className="h-100 d-flex flex-column order-take-catalog-card"
          actions={
            <span className="badge bg-secondary-subtle text-secondary-emphasis rounded-pill fw-semibold order-count-badge">
              {filteredDishes.length} de {totalActiveDishes}
            </span>
          }
        >
          {/* Filtros: buscador + categoría, en una sola fila responsive */}
          <div className="row g-2 g-sm-3 mb-3">
            <div className="col-12 col-sm-7">
              <SearchBar
                value={dishSearchQuery}
                onChange={setDishSearchQuery}
                placeholder="Buscar plato por nombre..."
              />
            </div>
            <div className="col-12 col-sm-5">
              <span id="dishCategoryFilterLabel" className="visually-hidden">Filtrar platos por categoría</span>
              {/* Select de categoría: reemplaza los chips de filtro para un
                  comportamiento predecible y compacto en cualquier ancho de
                  pantalla, siguiendo el mismo patrón que CatalogPage. */}
              <CustomDropdownSelect
                id="dishCategoryFilter"
                labelId="dishCategoryFilterLabel"
                value={selectedDishCategory}
                onChange={setSelectedDishCategory}
                size="sm"
                options={[
                  { value: 'todas', label: 'Todas las Categorías', icon: 'bi-grid-3x3-gap-fill', colorVariant: 'secondary' },
                  ...categories.map(cat => ({
                    value: cat.id,
                    label: cat.name,
                    icon: 'bi-tag-fill',
                    colorVariant: 'primary' as const,
                  })),
                ]}
              />
            </div>
          </div>

          <div className="flex-grow-1 overflow-y-auto order-take-catalog-scroll">
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
                      className={`p-2 border rounded-3 bg-white d-flex justify-content-between align-items-start h-100 order-dish-item${!dish.isAvailableToday ? ' order-dish-item-unavailable' : ''}`}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div className="order-dish-item-name">
                          {dish.name}
                          {!dish.isAvailableToday && <Badge status="AGOTADO" variant="danger" />}
                        </div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <small className="order-dish-item-price">S/ {dish.price.toFixed(2)}</small>
                          {/* Tiempo de prep. discreto: informa al mesero sin competir con el precio */}
                          <small className="text-muted order-dish-item-preptime">
                            <i className="bi bi-stopwatch me-1" aria-hidden="true"></i>
                            {dish.prepTimeMinutes} min
                          </small>
                        </div>
                        {/* Alérgenos — mismo badge/tono que Catálogo y Cocina */}
                        {dish.allergens && dish.allergens.length > 0 && (
                          <div className="kds-allergen-badge mb-0">
                            <i className="bi bi-exclamation-octagon-fill flex-shrink-0" aria-hidden="true"></i>
                            <span>Contiene: {dish.allergens.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary flex-shrink-0 ms-2 order-dish-add-button"
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

      {/* Right: Comanda Builder */}
      <div className="col-12 col-lg-5 col-xl-4 order-take-cart-pane">
        <SectionCard
          icon="bi-receipt"
          title="Comanda de Mesa"
          className="h-100 d-flex flex-column order-take-cart-card"
          actions={
            cartItems.length > 0 ? (
              <span className="badge bg-primary rounded-pill">
                {cartItems.reduce((sum, i) => sum + i.quantity, 0)} ítem(s)
              </span>
            ) : undefined
          }
        >
          <div className="d-none d-sm-block">
            {orderSetupFields('desktop', true)}
          </div>

          {/* Cart List */}
          <div className="flex-grow-1 overflow-y-auto mb-3 order-take-cart-list">
            <h3 className="order-cart-heading">
              Ítems del Pedido no Enviados
            </h3>
            {cartItems.length === 0 ? (
              <div className="text-center py-4 border rounded-3 order-cart-empty">
                <i className="bi bi-cart-plus d-block mb-1" aria-hidden="true"></i>
                Selecciona platos de la lista para armar la comanda.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="rounded-3 border bg-white shadow-sm order-cart-item">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="order-cart-item-name">
                        {item.dish.name}
                      </span>
                      <span className="order-cart-item-price">
                        S/ {(item.dish.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    {item.observation && (
                      <div className="p-2 rounded mb-2 order-cart-item-note">
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
                        <span className="fw-bold order-cart-item-qty">
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
                          onClick={() => onOpenObservation(idx, item.observation)}
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
              <span className="order-cart-subtotal-label">Subtotal Estimado:</span>
              <span className="order-cart-subtotal-value">S/ {cartSubtotal.toFixed(2)}</span>
            </div>
            <button
              type="button"
              className="btn-brand btn w-100 fw-bold order-take-send-button"
              disabled={cartItems.length === 0 || !selectedTableId}
              onClick={handleConfirmAndSendOrder}
            >
              <i className="bi bi-send-fill me-2"></i> Confirmar y Enviar a Cocina
            </button>
            {(cartItems.length === 0 || !selectedTableId) && (
              <small className="d-block text-center mt-2 order-take-send-hint">
                {!selectedTableId ? 'Selecciona una mesa para continuar.' : 'Agrega al menos un plato a la comanda.'}
              </small>
            )}
          </div>
        </SectionCard>
      </div>
      </div>
    </>
  );
};

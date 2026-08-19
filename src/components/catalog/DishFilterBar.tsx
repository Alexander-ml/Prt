import React from 'react';
import type { Category } from '../../types';
import { SectionCard } from '../common/SectionCard';
import { SearchBar } from '../common/SearchBar';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';
import { KITCHEN_STATION_META, KITCHEN_STATION_ORDER } from '../kitchen/kitchenMeta';
import { AVAILABILITY_FILTER_OPTIONS } from './catalogMeta';

interface DishFilterBarProps {
  categories: Category[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedAvailability: string;
  onAvailabilityChange: (value: string) => void;
  selectedStation: string;
  onStationChange: (value: string) => void;
  /** Si no se recibe (rol no-admin), el botón "Registrar Plato" no se muestra. */
  onCreateDish?: () => void;
}

/**
 * DishFilterBar — SectionCard con la búsqueda y los 3 filtros de la vista
 * de Platos (Categoría / Estado / Estación de cocina), más el botón
 * "Registrar Plato". El botón vive aquí, pegado a la lista que crea —igual
 * que "Nueva Área"/"Nueva Mesa" en TablesConfigView— en vez de compartir el
 * header de la página con acciones de Categorías.
 */
export const DishFilterBar: React.FC<DishFilterBarProps> = ({
  categories,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedAvailability,
  onAvailabilityChange,
  selectedStation,
  onStationChange,
  onCreateDish,
}) => {
  return (
    <SectionCard
      icon="bi-funnel"
      title="Filtros del Catálogo"
      className="mb-4 catalog-filter-card"
      actions={
        onCreateDish && (
          <button type="button" className="btn-brand btn btn-sm fw-semibold rounded-3" onClick={onCreateDish}>
            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i> Registrar Plato
          </button>
        )
      }
    >
      <div className="catalog-filter-grid">
        <div className="catalog-filter-search">
          <label id="catalogSearchLabel" htmlFor="catalogDishSearch" className="catalog-filter-label">Buscar plato</label>
          <SearchBar
            id="catalogDishSearch"
            labelledBy="catalogSearchLabel"
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Buscar plato por nombre o descripción..."
          />
        </div>
        <div>
          <span id="catalogCategoryLabel" className="catalog-filter-label">Categoría</span>
          <CustomDropdownSelect
            value={selectedCategory}
            onChange={onCategoryChange}
            size="sm"
            labelId="catalogCategoryLabel"
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
        <div>
          <span id="catalogAvailabilityLabel" className="catalog-filter-label">Estado</span>
          <CustomDropdownSelect
            value={selectedAvailability}
            onChange={onAvailabilityChange}
            size="sm"
            labelId="catalogAvailabilityLabel"
            options={AVAILABILITY_FILTER_OPTIONS}
          />
        </div>
        <div>
          <span id="catalogStationLabel" className="catalog-filter-label">Estación</span>
          <CustomDropdownSelect
            value={selectedStation}
            onChange={onStationChange}
            size="sm"
            labelId="catalogStationLabel"
            placeholder="Estación de cocina..."
            options={[
              { value: 'todas', label: 'Todas las Estaciones', icon: 'bi-grid-3x3-gap-fill', colorVariant: 'secondary' },
              ...KITCHEN_STATION_ORDER.map(station => ({
                value: station,
                label: KITCHEN_STATION_META[station].label,
                icon: KITCHEN_STATION_META[station].icon,
                colorVariant: KITCHEN_STATION_META[station].colorTheme,
              })),
            ]}
          />
        </div>
      </div>
    </SectionCard>
  );
};

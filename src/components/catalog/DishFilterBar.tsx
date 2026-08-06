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
      className="mb-4"
      actions={
        onCreateDish && (
          <button type="button" className="btn-brand btn btn-sm fw-semibold rounded-3" onClick={onCreateDish}>
            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i> Registrar Plato
          </button>
        )
      }
    >
      <div className="row g-3 align-items-center">
        <div className="col-12">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Buscar plato por nombre o descripción..."
          />
        </div>
        <div className="col-12 col-sm-6 col-md-4">
          {/* Select de categorización: colores neutros, sin semántica de alerta */}
          <CustomDropdownSelect
            value={selectedCategory}
            onChange={onCategoryChange}
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
        <div className="col-12 col-sm-6 col-md-4">
          {/* Select de estado: colores semánticos por disponibilidad */}
          <CustomDropdownSelect
            value={selectedAvailability}
            onChange={onAvailabilityChange}
            size="sm"
            options={AVAILABILITY_FILTER_OPTIONS}
          />
        </div>
        <div className="col-12 col-sm-12 col-md-4">
          {/* Select de estación de cocina (KDS): mismos colores/íconos que Cocina */}
          <CustomDropdownSelect
            value={selectedStation}
            onChange={onStationChange}
            size="sm"
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
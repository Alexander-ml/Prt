import React from 'react';
import type { InsumoCategory } from '../../types';
import { SectionCard } from '../common/SectionCard';
import { SearchBar } from '../common/SearchBar';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';

interface InsumoFilterBarProps {
  insumoCategories: InsumoCategory[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  /** true cuando el filtro de "Bajo Stock" está activo (llegó por clic desde el StatCard). */
  lowStockOnly: boolean;
  onToggleLowStockOnly: () => void;
  onCreateInsumo: () => void;
}

/**
 * InsumoFilterBar — SectionCard con la búsqueda, el filtro de categoría y
 * el botón "Registrar Insumo". El botón vive aquí, pegado a la lista que
 * crea —igual que `DishFilterBar` en Catálogo y "Nueva Mesa" en
 * `TablesConfigView`— en vez de compartir el `PageHeader` de la página,
 * que en Inventario queda reservado para las pestañas Insumos/Categorías.
 */
export const InsumoFilterBar: React.FC<InsumoFilterBarProps> = ({
  insumoCategories,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  lowStockOnly,
  onToggleLowStockOnly,
  onCreateInsumo,
}) => {
  return (
    <SectionCard
      icon="bi-funnel"
      title="Filtros del Inventario"
      className="mb-4"
      actions={
        <button type="button" className="btn-brand btn btn-sm fw-semibold rounded-3" onClick={onCreateInsumo}>
          <i className="bi bi-plus-lg me-1" aria-hidden="true"></i> Registrar Insumo
        </button>
      }
    >
      <div className="row g-3 align-items-center">
        <div className="col-12 col-md-5">
          <SearchBar value={searchQuery} onChange={onSearchChange} placeholder="Buscar insumo por nombre..." />
        </div>
        <div className="col-12 col-md-4">
          <CustomDropdownSelect
            value={selectedCategory}
            onChange={onCategoryChange}
            size="sm"
            options={[
              { value: 'todas', label: 'Todas las Categorías', icon: 'bi-grid-3x3-gap-fill', colorVariant: 'secondary' },
              ...insumoCategories.map(cat => ({
                value: cat.id,
                label: cat.name,
                icon: 'bi-tag-fill',
                colorVariant: 'primary' as const,
              })),
            ]}
          />
        </div>
        <div className="col-12 col-md-3">
          <button
            type="button"
            className={`btn w-100 fw-semibold ${lowStockOnly ? 'btn-danger text-white' : 'btn-outline-secondary bg-white'}`}
            style={{ borderRadius: 8 }}
            onClick={onToggleLowStockOnly}
          >
            <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true"></i>
            Solo Bajo Stock
          </button>
        </div>
      </div>
    </SectionCard>
  );
};
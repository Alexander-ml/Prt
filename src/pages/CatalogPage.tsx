import React, { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { CatalogStatsRow } from '../components/catalog/CatalogStatsRow';
import { DishesView } from '../components/catalog/DishesView';
import { CategoriesView } from '../components/catalog/CategoriesView';
import { CatalogMenuView } from '../components/catalog/CatalogMenuView';
import { ResponsiveSectionNav } from '../components/common/ResponsiveSectionNav';

/**
 * CatalogPage — Catálogo de Platos y Categorías (RF-08 a RF-16).
 *
 * Orquestador delgado: solo decide qué vista mostrar. Toda la lógica de
 * cada vista vive en su propio componente bajo `components/catalog/`,
 * siguiendo exactamente el mismo patrón que `TablesPage`:
 *  - DishesView      → alta, edición y filtrado de platos (todos los roles ven, solo Admin edita)
 *  - CategoriesView  → alta, edición y borrado de categorías (solo Admin edita)
 *
 * Cada `View` lee `useApp()` directamente, así que esta página no necesita
 * pasar `categories`, `dishes`, etc. como props hacia abajo.
 */

type CatalogViewMode = 'platos' | 'categorias' | 'carta';

export const CatalogPage: React.FC = () => {

  const CATALOG_VIEW_ITEMS = [
    { value: 'platos', label: 'Platos', icon: 'bi-egg-fried' },
    { value: 'categorias', label: 'Categorías', icon: 'bi-tags-fill' },
    { value: 'carta', label: 'Carta', icon: 'bi-journal-text' },
  ]

  const [viewMode, setViewMode] = useState<CatalogViewMode>('platos');

  return (
    <div className="container-fluid p-0">
      <PageHeader
        icon="bi-book-half"
        title="Catálogo de Platos y Categorías"
        subtitle="Gestión del menú digital: platos, precios, disponibilidad y categorías."
        actions={
          <ResponsiveSectionNav
            items={CATALOG_VIEW_ITEMS}
            value={viewMode}
            onChange={value => setViewMode(value as CatalogViewMode)}
            ariaLabel="Cambiar vista del setViewModetálogo"
          />
        }
      />

      <CatalogStatsRow />

      {viewMode === 'platos' && <DishesView />}
      {viewMode === 'categorias' && <CategoriesView />}
      {viewMode === 'carta' && <CatalogMenuView />}
    </div>
  );
};

import React, { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { CatalogStatsRow } from '../components/catalog/CatalogStatsRow';
import { DishesView } from '../components/catalog/DishesView';
import { CategoriesView } from '../components/catalog/CategoriesView';

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
export const CatalogPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'platos' | 'categorias'>('platos');

  return (
    <div className="container-fluid p-0">
      <PageHeader
        icon="bi-book-half"
        title="Catálogo de Platos y Categorías"
        subtitle="Gestión del menú digital: platos, precios, disponibilidad y categorías."
        actions={
          <div
            className="d-flex w-100 gap-2"
            role="tablist"
            aria-label="Cambiar vista del catálogo"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'platos'}
              className={`btn fw-semibold flex-fill d-flex align-items-center justify-content-center gap-1 ${activeTab === 'platos' ? 'btn-primary' : 'btn-outline-primary'}`}
              style={{minHeight: 44,borderRadius: 8,fontSize: 'clamp(0.78rem, 3.2vw, 0.9rem)',}}
              onClick={() => setActiveTab('platos')}
            >
              <i className="bi bi-egg-fried me-1" aria-hidden="true"></i>
              Platos y Carta
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'categorias'}
              className={`btn fw-semibold flex-fill d-flex align-items-center justify-content-center gap-1 ${activeTab === 'categorias' ? 'btn-primary' : 'btn-outline-primary'}`}
              style={{minHeight: 44,borderRadius: 8,fontSize: 'clamp(0.78rem, 3.2vw, 0.9rem)',}}
              onClick={() => setActiveTab('categorias')}
            >
              <i className="bi bi-tags-fill me-1" aria-hidden="true"></i>
              Categorías
            </button>
          </div>
        }
      />

      <CatalogStatsRow />

      {activeTab === 'platos' ? <DishesView /> : <CategoriesView />}
    </div>
  );
};
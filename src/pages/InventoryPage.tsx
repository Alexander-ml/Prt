import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { InventoryStatsRow } from '../components/inventory/InventoryStatsRow';
import { InsumosView } from '../components/inventory/InsumosView';
import { InsumoCategoriesView } from '../components/inventory/InsumoCategoriesView';

/**
 * InventoryPage — Inventario e Insumos (RF-66 a RF-72).
 *
 * Orquestador delgado: solo decide qué pestaña mostrar, igual que
 * `CatalogPage`. Toda la lógica de cada vista vive en su propio
 * componente bajo `components/inventory/`:
 *  - InsumosView           → alta, edición, movimientos y filtrado de insumos
 *  - InsumoCategoriesView  → alta, edición y borrado de categorías de insumo
 *
 * El `PageHeader` queda reservado para el cambio de pestaña Insumos /
 * Categorías — el botón "Registrar Insumo" ya no vive acá, vive en
 * `InsumoFilterBar`, pegado a la lista que crea (mismo criterio que
 * `CatalogPage` con "Platos y Carta" / "Categorías").
 */
export const InventoryPage: React.FC = () => {
  const { currentRole } = useApp();
  const [activeTab, setActiveTab] = useState<'insumos' | 'categorias'>('insumos');

  // Se incrementa cuando el StatCard "Bajo Stock Mínimo" recibe un clic —
  // fuerza a InsumosView a activar su filtro de bajo stock aunque ya
  // estuviera en la pestaña de Insumos.
  const [lowStockRequestId, setLowStockRequestId] = useState(0);

  const handleLowStockClick = () => {
    setActiveTab('insumos');
    setLowStockRequestId(id => id + 1);
  };

  if (currentRole !== 'Administrador') {
    return (
      <div className="container-fluid p-0">
        <EmptyState
          icon="bi-boxes"
          title="Acceso Restringido"
          description="Este módulo es administrado únicamente por el Administrador en esta etapa del sistema."
        />
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 animate-fadeinup">
      <PageHeader
        icon="bi-boxes"
        title="Inventario e Insumos"
        subtitle="Control de insumos disponibles, alertas de reposición y movimientos de stock."
        actions={
          <div
            className="d-flex w-100 gap-2"
            role="tablist"
            aria-label="Cambiar vista del inventario"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'insumos'}
              className={`btn fw-semibold flex-fill d-flex align-items-center justify-content-center gap-1 ${activeTab === 'insumos' ? 'btn-primary' : 'btn-outline-primary'}`}
              style={{ minHeight: 44, borderRadius: 8, fontSize: 'clamp(0.78rem, 3.2vw, 0.9rem)' }}
              onClick={() => setActiveTab('insumos')}
            >
              <i className="bi bi-boxes me-1" aria-hidden="true"></i>
              Insumos
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'categorias'}
              className={`btn fw-semibold flex-fill d-flex align-items-center justify-content-center gap-1 ${activeTab === 'categorias' ? 'btn-primary' : 'btn-outline-primary'}`}
              style={{ minHeight: 44, borderRadius: 8, fontSize: 'clamp(0.78rem, 3.2vw, 0.9rem)' }}
              onClick={() => setActiveTab('categorias')}
            >
              <i className="bi bi-tags-fill me-1" aria-hidden="true"></i>
              Categorías
            </button>
          </div>
        }
      />

      <InventoryStatsRow onLowStockClick={handleLowStockClick} />

      {activeTab === 'insumos' ? (
        <InsumosView lowStockRequestId={lowStockRequestId} />
      ) : (
        <InsumoCategoriesView />
      )}
    </div>
  );
};
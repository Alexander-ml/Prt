import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { InventoryStatsRow } from '../components/inventory/InventoryStatsRow';
import { InsumosView } from '../components/inventory/InsumosView';
import { InsumoCategoriesView } from '../components/inventory/InsumoCategoriesView';
import { StockMovementsView } from '../components/inventory/StockMovementsView';
import { WastesView } from '../components/inventory/WastesView';
import { SuppliersView } from '../components/inventory/SuppliersView';
import { AlertsView } from '../components/inventory/AlertsView';

type InventoryTab = 'insumos' | 'movimientos' | 'mermas' | 'proveedores' | 'alertas' | 'categorias';

export const InventoryPage: React.FC = () => {
  const { currentRole } = useApp();
  const [activeTab, setActiveTab] = useState<InventoryTab>('insumos');
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

  const tabs: { id: InventoryTab; label: string; icon: string }[] = [
    { id: 'insumos', label: 'Insumos', icon: 'bi-boxes' },
    { id: 'movimientos', label: 'Kardex', icon: 'bi-arrow-repeat' },
    { id: 'mermas', label: 'Mermas', icon: 'bi-box-seam' },
    { id: 'proveedores', label: 'Proveedores', icon: 'bi-truck' },
    { id: 'alertas', label: 'Alertas', icon: 'bi-bell' },
    { id: 'categorias', label: 'Categorías', icon: 'bi-tags-fill' }
  ];

  return (
    <div className="container-fluid p-0 animate-fadeinup">
      <PageHeader
        icon="bi-boxes"
        title="Inventario e Insumos"
        subtitle="Control de stock, movimientos, mermas, proveedores y alertas de reposición."
        actions={
          <div
            className="d-flex w-100 gap-2 flex-wrap"
            role="tablist"
            aria-label="Cambiar vista del inventario"
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`btn fw-semibold flex-grow-1 flex-fill d-flex align-items-center justify-content-center gap-1 ${activeTab === tab.id ? 'btn-primary' : 'btn-outline-primary'}`}
                style={{ minHeight: 44, borderRadius: 8, fontSize: 'clamp(0.78rem, 3.2vw, 0.9rem)', whiteSpace: 'nowrap' }}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={`bi ${tab.icon} me-1`} aria-hidden="true"></i>
                {tab.label}
              </button>
            ))}
          </div>
        }
      />

      <InventoryStatsRow onLowStockClick={handleLowStockClick} />

      {activeTab === 'insumos' && <InsumosView lowStockRequestId={lowStockRequestId} />}
      {activeTab === 'movimientos' && <StockMovementsView />}
      {activeTab === 'mermas' && <WastesView />}
      {activeTab === 'proveedores' && <SuppliersView />}
      {activeTab === 'alertas' && <AlertsView />}
      {activeTab === 'categorias' && <InsumoCategoriesView />}
    </div>
  );
};
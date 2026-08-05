import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { TablesFloorplanView } from '../components/tables/TablesFloorplanView';
import { TablesConfigView } from '../components/tables/TablesConfigView';

/**
 * TablesPage — Áreas y Plano de Mesas (RF-25 a RF-38).
 *
 * Orquestador delgado: solo decide qué vista mostrar. Toda la lógica de
 * cada vista vive en su propio componente bajo `components/tables/`:
 *  - TablesFloorplanView → plano operativo de sala (todos los roles)
 *  - TablesConfigView    → configuración de áreas y mesas (solo Admin)
 */
export const TablesPage: React.FC = () => {
  const { currentRole } = useApp();
  const isAdmin = currentRole === 'Administrador';

  // View Mode: 'plano' (visual floorplan) vs 'config' (admin areas & table management)
  const [viewMode, setViewMode] = useState<'plano' | 'config'>('plano');

  return (
    <div className="container-fluid p-0">
      <PageHeader
        icon="bi-diagram-3-fill"
        title="Áreas y Plano de Mesas"
        subtitle="Control interactivo de disponibilidad, plano físico de sala, reservas y traslados"
        actions={
          isAdmin && (
            <div
              className="d-flex w-100 gap-2"
              role="tablist"
              aria-label="Cambiar vista de mesas"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'plano'}
                className={`btn fw-semibold flex-fill d-flex align-items-center justify-content-center gap-1 ${viewMode === 'plano'  ? 'btn-primary'  : 'btn-outline-primary'}`}
                style={{minHeight: 44,borderRadius: 8,fontSize: 'clamp(0.78rem, 3.2vw, 0.9rem)',}}
                onClick={() => setViewMode('plano')}
              >
                <i className="bi bi-grid-3x3-gap-fill me-1" aria-hidden="true"></i>
                Plano de Sala
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'config'}
                className={`btn fw-semibold flex-fill d-flex align-items-center justify-content-center gap-1 ${viewMode === 'config'  ? 'btn-primary'  : 'btn-outline-primary'}`}
                style={{minHeight: 44,borderRadius: 8,fontSize: 'clamp(0.78rem, 3.2vw, 0.9rem)',}}
                onClick={() => setViewMode('config')}
              >
                <i className="bi bi-gear-fill me-1" aria-hidden="true"></i>
                Configurar Áreas
              </button>
            </div>
          )
        }
      />

      {viewMode === 'plano' ? <TablesFloorplanView /> : <TablesConfigView />}
    </div>
  );
};
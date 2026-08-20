import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { ResponsiveSectionNav } from '../components/common/ResponsiveSectionNav';
import { TablesFloorplanView } from '../components/tables/TablesFloorplanView';
import { TablesConfigView } from '../components/tables/TablesConfigView';

type TableViewMode = 'plano' | 'config';

const TABLES_SECTION_ITEMS = [
  { value: 'plano', label: 'Plano de Sala', icon: 'bi-grid-3x3-gap-fill' },
  { value: 'config', label: 'Configurar Áreas', icon: 'bi-gear-fill' },
];

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
  const [viewMode, setViewMode] = useState<TableViewMode>('plano');

  return (
    <div className="container-fluid p-0">
      <PageHeader
        icon="bi-diagram-3-fill"
        title="Áreas y Plano de Mesas"
        subtitle="Control interactivo de disponibilidad, plano físico de sala, reservas y traslados"
        actions={
          isAdmin && (
            <ResponsiveSectionNav
              items={TABLES_SECTION_ITEMS}
              value={viewMode}
              onChange={value => setViewMode(value as TableViewMode)}
              ariaLabel="Cambiar vista de mesas"
            />
          )
        }
      />

      {viewMode === 'plano' ? <TablesFloorplanView /> : <TablesConfigView />}
    </div>
  );
};

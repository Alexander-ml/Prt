import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { ResponsiveSectionNav } from '../components/common/ResponsiveSectionNav';
import { RestaurantInfoView } from '../components/config/RestaurantInfoView';
import { TaxesView } from '../components/config/TaxesView';
import { PromotionsView } from '../components/config/PromotionsView';

type ConfigViewMode = 'info' | 'impuestos' | 'promociones';

const CONFIG_VIEW_ITEMS = [
  { value: 'info', label: 'Datos del Local', icon: 'bi-building' },
  { value: 'impuestos', label: 'Impuestos', icon: 'bi-percent' },
  { value: 'promociones', label: 'Promociones', icon: 'bi-ticket-perforated-fill' },
];

/**
 * ConfigPage — Configuración General del Sistema (RF-17 a RF-24).
 *
 * Orquestador delgado, mismo patrón que `CatalogPage`/`TablesPage`: cada
 * pestaña vive en su propio componente autosuficiente bajo
 * `components/config/` (lee `useApp()` directo, sin props hacia abajo) y
 * los 3 dominios no dependen entre sí.
 *
 * La navegación entre pestañas usa `ResponsiveSectionNav` — el mismo
 * componente que `CatalogPage` (Platos/Categorías/Carta) y `TablesPage` —
 * en vez de 3 botones armados a mano con ARIA duplicado. Con 3 opciones,
 * `ResponsiveSectionNav` colapsa automáticamente a un selector en Mobile
 * (su modo `auto` activa el selector cuando hay más de 2 opciones), igual
 * que ya ocurre en Catálogo.
 *
 * Guard de acceso: antes este módulo solo deshabilitaba campos y ocultaba
 * botones, dejando visibles el RUC, tarifas de impuestos y promociones a
 * cualquier rol que entrara por URL directa. Bloquea igual que `UsersPage`.
 */
export const ConfigPage: React.FC = () => {
  const { currentRole } = useApp();

  const [viewMode, setViewMode] = useState<ConfigViewMode>('info');

  // Guard DESPUÉS de todos los hooks de la página, nunca antes.
  if (currentRole !== 'Administrador') {
    return (
      <div className="container-fluid p-0">
        <EmptyState
          icon="bi-shield-lock"
          title="Acceso Restringido"
          description="Este módulo es administrado únicamente por usuarios con rol de Administrador."
        />
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      <PageHeader
        icon="bi-sliders"
        title="Configuración General del Sistema"
        subtitle="Parámetros comerciales, impuestos, promociones y datos operativos del establecimiento."
        actions={
          <ResponsiveSectionNav
            items={CONFIG_VIEW_ITEMS}
            value={viewMode}
            onChange={value => setViewMode(value as ConfigViewMode)}
            ariaLabel="Cambiar sección de configuración"
          />
        }
      />

      {viewMode === 'info' && <RestaurantInfoView />}
      {viewMode === 'impuestos' && <TaxesView />}
      {viewMode === 'promociones' && <PromotionsView />}
    </div>
  );
};

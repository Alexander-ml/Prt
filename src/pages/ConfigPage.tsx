import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { RestaurantInfoView } from '../components/config/RestaurantInfoView';
import { TaxesView } from '../components/config/TaxesView';
import { PromotionsView } from '../components/config/PromotionsView';

/**
 * ConfigPage — Configuración General del Sistema (RF-17 a RF-24).
 *
 * Orquestador delgado, mismo patrón que `CatalogPage`/`TablesPage`: cada
 * pestaña vive en su propio componente autosuficiente bajo
 * `components/config/` (lee `useApp()` directo, sin props hacia abajo) y
 * los 3 dominios no dependen entre sí.
 *
 * Guard de acceso nuevo: antes este módulo solo deshabilitaba campos y
 * ocultaba botones, dejando visibles el RUC, tarifas de impuestos y
 * promociones a cualquier rol que entrara por URL directa. Ahora bloquea
 * igual que `UsersPage`.
 */
export const ConfigPage: React.FC = () => {
  const { currentRole } = useApp();

  const [activeTab, setActiveTab] = useState<'info' | 'impuestos' | 'promociones'>('info');

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
          <div
            className="d-flex w-100 gap-2"
            role="tablist"
            aria-label="Cambiar sección de configuración"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'info'}
              className={`btn fw-semibold flex-fill d-flex align-items-center justify-content-center gap-1 ${activeTab === 'info' ? 'btn-primary' : 'btn-outline-primary'}`}
              style={{ minHeight: 44, borderRadius: 8, fontSize: 'clamp(0.78rem, 3.2vw, 0.9rem)' }}
              onClick={() => setActiveTab('info')}
            >
              <i className="bi bi-building me-1" aria-hidden="true"></i>
              Datos del Local
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'impuestos'}
              className={`btn fw-semibold flex-fill d-flex align-items-center justify-content-center gap-1 ${activeTab === 'impuestos' ? 'btn-primary' : 'btn-outline-primary'}`}
              style={{ minHeight: 44, borderRadius: 8, fontSize: 'clamp(0.78rem, 3.2vw, 0.9rem)' }}
              onClick={() => setActiveTab('impuestos')}
            >
              <i className="bi bi-percent me-1" aria-hidden="true"></i>
              Impuestos
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'promociones'}
              className={`btn fw-semibold flex-fill d-flex align-items-center justify-content-center gap-1 ${activeTab === 'promociones' ? 'btn-primary' : 'btn-outline-primary'}`}
              style={{ minHeight: 44, borderRadius: 8, fontSize: 'clamp(0.78rem, 3.2vw, 0.9rem)' }}
              onClick={() => setActiveTab('promociones')}
            >
              <i className="bi bi-ticket-perforated-fill me-1" aria-hidden="true"></i>
              Promociones
            </button>
          </div>
        }
      />

      {activeTab === 'info' && <RestaurantInfoView />}
      {activeTab === 'impuestos' && <TaxesView />}
      {activeTab === 'promociones' && <PromotionsView />}
    </div>
  );
};
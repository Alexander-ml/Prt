import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import { FinancialKpisRow } from '../components/accounting/FinancialKpisRow';
import { LedgerView } from '../components/accounting/LedgerView';
import { LedgerCategoriesView } from '../components/accounting/LedgerCategoriesView';
import type { PeriodFilter } from '../components/accounting/accountingMeta';

/**
 * AccountingPage — Contabilidad Formal (RF-73 a RF-75).
 *
 * Orquestador delgado: solo decide qué pestaña mostrar y guarda el
 * período elegido (compartido entre los KPIs de arriba y el Libro
 * Diario), igual que `CatalogPage`/`InventoryPage`. Toda la lógica de
 * cada vista vive en su propio componente bajo `components/accounting/`:
 *  - FinancialKpisRow      → 4 StatCards derivados en vivo del período
 *  - LedgerView            → distribución, desgloses, libro diario y modal de asiento
 *  - LedgerCategoriesView  → alta, edición y borrado de categorías contables
 *
 * El `PageHeader` queda reservado para el cambio de pestaña Resumen /
 * Categorías — los botones "Exportar Reporte" y "Nuevo Asiento" ya no
 * viven acá, viven en `LedgerFilterBar`, pegados a la lista que exportan
 * y crean (mismo criterio que `CatalogPage` con "Platos y Carta" /
 * "Categorías" y que `HistoryView` con su botón "Exportar").
 *
 * `financialSummary` ya NO se lee de `useApp()` en ningún lugar de este
 * módulo: se deriva en vivo de `ledgerEntries` + `sales` para el período
 * elegido (ver components/accounting/accountingMeta.ts), así que anular
 * una venta en Ventas se refleja acá sin que ningún código tenga que
 * "acordarse" de actualizar Contabilidad.
 */
export const AccountingPage: React.FC = () => {
  const { currentRole } = useApp();
  const [activeTab, setActiveTab] = useState<'resumen' | 'categorias'>('resumen');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('este_mes');

  // Se incrementa cuando el StatCard "Egresos Registrados" recibe un clic —
  // fuerza a LedgerView a activar su filtro de solo egresos aunque ya
  // estuviera en la pestaña de Resumen (mismo criterio que InventoryPage
  // con el StatCard "Bajo Stock Mínimo").
  const [expenseFilterRequestId, setExpenseFilterRequestId] = useState(0);

  const handleExpenseClick = () => {
    setActiveTab('resumen');
    setExpenseFilterRequestId(id => id + 1);
  };

  if (currentRole !== 'Administrador') {
    return (
      <div className="container-fluid p-0">
        <EmptyState
          icon="bi-journal-text"
          title="Acceso Restringido"
          description="La contabilidad formal es gestionada exclusivamente por el Administrador."
        />
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 animate-fadeinup">
      <PageHeader
        icon="bi-journal-text"
        title="Contabilidad Formal"
        subtitle="Resumen financiero derivado en vivo de ventas, ingresos y egresos del período."
        actions={
          <div
            className="d-flex w-100 gap-2"
            role="tablist"
            aria-label="Cambiar vista de contabilidad"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'resumen'}
              className={`btn fw-semibold flex-fill d-flex align-items-center justify-content-center gap-1 ${activeTab === 'resumen' ? 'btn-primary' : 'btn-outline-primary'}`}
              style={{ minHeight: 44, borderRadius: 8, fontSize: 'clamp(0.78rem, 3.2vw, 0.9rem)' }}
              onClick={() => setActiveTab('resumen')}
            >
              <i className="bi bi-journal-text me-1" aria-hidden="true"></i>
              Resumen y Libro Diario
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
              Categorías Contables
            </button>
          </div>
        }
      />

      <FinancialKpisRow periodFilter={periodFilter} onExpenseClick={handleExpenseClick} />

      {activeTab === 'resumen' ? (
        <LedgerView
          periodFilter={periodFilter}
          onPeriodFilterChange={setPeriodFilter}
          expenseFilterRequestId={expenseFilterRequestId}
        />
      ) : (
        <LedgerCategoriesView />
      )}
    </div>
  );
};
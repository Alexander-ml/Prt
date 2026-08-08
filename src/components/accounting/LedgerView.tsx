import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SectionCard } from '../common/SectionCard';
import { FinancialDistributionCard } from './FinancialDistributionCard';
import { ExpenseBreakdownCard } from './ExpenseBreakdownCard';
import { PaymentMethodBreakdownCard } from './PaymentMethodBreakdownCard';
import { LedgerFilterBar } from './LedgerFilterBar';
import { LedgerTable } from './LedgerTable';
import { LedgerEntryFormModal, type LedgerEntryFormData } from './LedgerEntryFormModal';
import {
  getPeriodRange,
  computeFinancialSummary,
  isDateInRange,
  type PeriodFilter,
} from './accountingMeta';

interface LedgerViewProps {
  periodFilter: PeriodFilter;
  onPeriodFilterChange: (value: PeriodFilter) => void;
  /** Se incrementa cuando AccountingPage recibe un clic en el StatCard
   *  "Egresos Registrados" — permite activar el filtro de solo egresos
   *  desde fuera aunque ya estuviera en 0 la vez anterior. Mismo criterio
   *  que `lowStockRequestId` en InsumosView (Inventario). */
  expenseFilterRequestId: number;
}

const emptyFormData = (defaultCategoryId: string): LedgerEntryFormData => ({
  type: 'egreso',
  categoryId: defaultCategoryId,
  description: '',
  amount: 150,
  reference: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
});

/**
 * LedgerView — Pestaña "Resumen y Libro Diario" del módulo Contabilidad.
 * Dueña de su propio estado (filtro de solo egresos, modal de asiento) y
 * lee `useApp()` directamente, igual que `InsumosView` en Inventario.
 * `financialSummary` NUNCA se lee de useApp() — no vive ahí; se calcula
 * acá mismo con `computeFinancialSummary`, siempre en vivo para el
 * período elegido (ver accountingMeta.ts).
 */
export const LedgerView: React.FC<LedgerViewProps> = ({ periodFilter, onPeriodFilterChange, expenseFilterRequestId }) => {
  const { ledgerEntries, ledgerCategories, sales, addLedgerEntry, showToast } = useApp();

  const [expenseOnly, setExpenseOnly] = useState(false);

  // Mismo patrón que InsumosView con lowStockRequestId: se ajusta durante
  // el render en vez de en un efecto, para no disparar un render en
  // cascada innecesario.
  const [lastHandledRequestId, setLastHandledRequestId] = useState(expenseFilterRequestId);
  if (expenseFilterRequestId !== lastHandledRequestId) {
    setLastHandledRequestId(expenseFilterRequestId);
    setExpenseOnly(true);
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const defaultEgresoCategoryId = ledgerCategories.find(c => c.kind === 'egreso')?.id ?? '';
  const [formData, setFormData] = useState<LedgerEntryFormData>(() => emptyFormData(defaultEgresoCategoryId));

  const currentRange = getPeriodRange(periodFilter);
  const summary = computeFinancialSummary(ledgerEntries, sales, currentRange);
  const marginPct = summary.totalRevenue > 0
    ? Math.round((summary.netProfit / summary.totalRevenue) * 100)
    : 0;

  const entriesInPeriod = ledgerEntries.filter(e => isDateInRange(e.date, currentRange));
  const filteredEntries = expenseOnly ? entriesInPeriod.filter(e => e.type === 'egreso') : entriesInPeriod;

  const handleFormChange = (patch: Partial<LedgerEntryFormData>) => {
    setFormData(prev => ({ ...prev, ...patch }));
  };

  const handleOpenModal = () => {
    setFormData(emptyFormData(defaultEgresoCategoryId));
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.categoryId) return;
    const category = ledgerCategories.find(c => c.id === formData.categoryId);
    addLedgerEntry({
      date: new Date().toISOString().split('T')[0],
      type: formData.type,
      categoryId: formData.categoryId,
      categoryName: category?.name ?? '',
      description: formData.description,
      amount: Number(formData.amount),
      reference: formData.reference,
    });
    setIsModalOpen(false);
  };

  const handleExportReport = () => {
    // Stub deliberado — la exportación real a Excel/PDF queda fuera de
    // este alcance (ver diagnóstico de Contabilidad, sección 8), mismo
    // criterio que el botón "Exportar" de Ventas → Historial.
    showToast('Reporte Exportado', 'Información contable exportada exitosamente.', 'info');
  };

  return (
    <>
      <FinancialDistributionCard summary={summary} marginPct={marginPct} />

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <ExpenseBreakdownCard ledgerEntries={ledgerEntries} sales={sales} range={currentRange} />
        </div>
        <div className="col-12 col-lg-6">
          <PaymentMethodBreakdownCard ledgerEntries={ledgerEntries} sales={sales} range={currentRange} />
        </div>
      </div>

      <SectionCard
        icon="bi-list-columns"
        title="Detalle de Ingresos y Egresos"
        noPadding
        actions={
          <LedgerFilterBar
            periodFilter={periodFilter}
            onPeriodFilterChange={onPeriodFilterChange}
            onExportReport={handleExportReport}
            onCreateEntry={handleOpenModal}
          />
        }
      >
        {expenseOnly && (
          <div className="px-3 pt-3">
            <span className="badge rounded-pill text-bg-light border d-inline-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
              <i className="bi bi-funnel-fill"></i> Mostrando solo egresos
              <button
                type="button"
                className="btn btn-sm btn-link text-muted text-decoration-none p-0 ms-2"
                style={{ fontSize: '0.75rem' }}
                onClick={() => setExpenseOnly(false)}
              >
                Quitar filtro
              </button>
            </span>
          </div>
        )}
        <LedgerTable entries={filteredEntries} sales={sales} />
      </SectionCard>

      <LedgerEntryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleFormChange}
        ledgerCategories={ledgerCategories}
      />
    </>
  );
};
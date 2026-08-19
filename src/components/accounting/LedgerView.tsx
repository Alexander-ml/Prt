import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SectionCard } from '../common/SectionCard';
import { Modal } from '../common/Modal';
import { FinancialDistributionCard } from './FinancialDistributionCard';
import { ExpenseBreakdownCard } from './ExpenseBreakdownCard';
import { PaymentMethodBreakdownCard } from './PaymentMethodBreakdownCard';
import { LedgerFilterBar } from './LedgerFilterBar';
import { LedgerTable } from './LedgerTable';
import { LedgerEntryFormModal, type LedgerEntryFormData } from './LedgerEntryFormModal';
import { IncomeStatementView } from './IncomeStatementView';
import { CashFlowView } from './CashFlowView';
import {
  getPeriodRange,
  computeFinancialSummary,
  isDateInRange,
  type PeriodFilter,
} from './accountingMeta';
import { exportLedgerToCSV, exportIncomeStatementCSV, exportCashFlowCSV } from '../../utils/exportUtils';

interface LedgerViewProps {
  periodFilter: PeriodFilter;
  onPeriodFilterChange: (value: PeriodFilter) => void;
  expenseFilterRequestId: number;
}

const emptyFormData = (defaultCategoryId: string): LedgerEntryFormData => ({
  type: 'egreso',
  categoryId: defaultCategoryId,
  description: '',
  amount: 150,
  reference: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
  date: new Date().toISOString().split('T')[0],
});

export const LedgerView: React.FC<LedgerViewProps> = ({ periodFilter, onPeriodFilterChange, expenseFilterRequestId }) => {
  const { ledgerEntries, ledgerCategories, sales, addLedgerEntry, updateLedgerEntry, reverseLedgerEntry, showToast } = useApp();

  const [expenseOnly, setExpenseOnly] = useState(false);
  const [lastHandledRequestId, setLastHandledRequestId] = useState(expenseFilterRequestId);
  if (expenseFilterRequestId !== lastHandledRequestId) {
    setLastHandledRequestId(expenseFilterRequestId);
    setExpenseOnly(true);
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ReturnType<typeof ledgerEntries.find> | null>(null);
  const [reversingEntry, setReversingEntry] = useState<ReturnType<typeof ledgerEntries.find> | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const defaultEgresoCategoryId = ledgerCategories.find(c => c.kind === 'egreso')?.id ?? '';
  const [formData, setFormData] = useState<LedgerEntryFormData>(() => emptyFormData(defaultEgresoCategoryId));

  const [typeFilter, setTypeFilter] = useState<'todos' | 'ingreso' | 'egreso'>('todos');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchText, setSearchText] = useState('');

  const currentRange = getPeriodRange(periodFilter);
  const summary = computeFinancialSummary(ledgerEntries, sales, currentRange);
  const marginPct = summary.totalRevenue > 0
    ? Math.round((summary.netProfit / summary.totalRevenue) * 100)
    : 0;

  const entriesInPeriod = ledgerEntries.filter(e => isDateInRange(e.date, currentRange));
  const filteredEntries = entriesInPeriod
    .filter(e => expenseOnly ? e.type === 'egreso' : true)
    .filter(e => typeFilter === 'todos' ? true : e.type === typeFilter)
    .filter(e => categoryFilter ? e.categoryId === categoryFilter : true)
    .filter(e => {
      if (!searchText.trim()) return true;
      const q = searchText.toLowerCase();
      return e.description.toLowerCase().includes(q) || e.reference.toLowerCase().includes(q) || e.categoryName.toLowerCase().includes(q);
    });

  const handleFormChange = (patch: Partial<LedgerEntryFormData>) => {
    setFormData(prev => ({ ...prev, ...patch }));
  };

  const handleOpenModal = () => {
    setEditingEntry(null);
    setFormData(emptyFormData(defaultEgresoCategoryId));
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry: ReturnType<typeof ledgerEntries.find>) => {
    if (!entry) return;
    setEditingEntry(entry);
    setFormData({
      type: entry.type,
      categoryId: entry.categoryId,
      description: entry.description,
      amount: entry.amount,
      reference: entry.reference,
      date: entry.date,
    });
    setIsModalOpen(true);
  };

  const handleReverseEntry = (entry: ReturnType<typeof ledgerEntries.find>) => {
    if (!entry) return;
    setReversingEntry(entry);
    setReversalReason('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.categoryId) return;

    if (editingEntry) {
      const reasonEl = document.getElementById('editReason') as HTMLInputElement;
      const reason = reasonEl?.value?.trim() || 'Edición de asiento';
      updateLedgerEntry(editingEntry.id, {
        date: formData.date,
        type: formData.type,
        categoryId: formData.categoryId,
        categoryName: ledgerCategories.find(c => c.id === formData.categoryId)?.name ?? '',
        description: formData.description,
        amount: Number(formData.amount),
        reference: formData.reference,
      }, reason);
    } else {
      const category = ledgerCategories.find(c => c.id === formData.categoryId);
      addLedgerEntry({
        date: formData.date,
        type: formData.type,
        categoryId: formData.categoryId,
        categoryName: category?.name ?? '',
        description: formData.description,
        amount: Number(formData.amount),
        reference: formData.reference,
      });
    }
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  const handleConfirmReverse = () => {
    if (!reversingEntry || !reversalReason.trim()) return;
    reverseLedgerEntry(reversingEntry.id, reversalReason);
    setReversingEntry(null);
    setReversalReason('');
  };

  const handleExportReport = (reportType: 'ledger' | 'income' | 'cashflow') => {
    const breakdown = ledgerEntries
      .filter(e => isDateInRange(e.date, currentRange))
      .map(e => ({ category: e.categoryName, amount: e.amount, type: e.type }));

    const totalInflows = breakdown.filter(b => b.type === 'ingreso').map(b => ({ source: b.category, amount: b.amount }));
    const totalOutflows = breakdown.filter(b => b.type === 'egreso').map(b => ({ source: b.category, amount: b.amount }));

    switch (reportType) {
      case 'ledger':
        exportLedgerToCSV(filteredEntries, currentRange.label);
        break;
      case 'income':
        exportIncomeStatementCSV(summary, currentRange.label, breakdown);
        break;
      case 'cashflow':
        exportCashFlowCSV(totalInflows, totalOutflows, currentRange.label);
        break;
    }
    showToast('Reporte Exportado', 'El archivo CSV fue descargado correctamente.', 'info');
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

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <button type="button" className="btn btn-sm btn-outline-success fw-semibold" style={{ borderRadius: 8 }} onClick={() => handleExportReport('income')}>
          <i className="bi bi-file-earmark-bar-graph me-1"></i> Estado de Resultados
        </button>
        <button type="button" className="btn btn-sm btn-outline-info fw-semibold" style={{ borderRadius: 8 }} onClick={() => handleExportReport('cashflow')}>
          <i className="bi bi-cash-stack me-1"></i> Flujo de Efectivo
        </button>
      </div>

      <IncomeStatementView periodFilter={periodFilter} />
      <CashFlowView periodFilter={periodFilter} />

      <SectionCard
        icon="bi-list-columns"
        title="Detalle de Ingresos y Egresos"
        noPadding
        actions={
          <LedgerFilterBar
            periodFilter={periodFilter}
            onPeriodFilterChange={onPeriodFilterChange}
            onExportReport={() => handleExportReport('ledger')}
            onCreateEntry={handleOpenModal}
            typeFilter={typeFilter}
            onTypeFilterChange={(v) => { setTypeFilter(v); if (v === 'egreso') setExpenseOnly(true); else setExpenseOnly(false); }}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            searchText={searchText}
            onSearchChange={setSearchText}
            ledgerCategories={ledgerCategories}
          />
        }
      >
        {expenseOnly && typeFilter === 'todos' && (
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
        <div className="px-3 pt-2 pb-1">
          <small className="text-muted">
            {filteredEntries.length} asiento{filteredEntries.length !== 1 ? 's' : ''} encontrado{filteredEntries.length !== 1 ? 's' : ''}
          </small>
        </div>
        <LedgerTable
          entries={filteredEntries}
          sales={sales}
          onEditEntry={handleEditEntry}
          onReverseEntry={handleReverseEntry}
        />
      </SectionCard>

      <LedgerEntryFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEntry(null); }}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleFormChange}
        ledgerCategories={ledgerCategories}
        editingEntryId={editingEntry?.id}
      />

      {reversingEntry && (
        <Modal
          isOpen={!!reversingEntry}
          onClose={() => setReversingEntry(null)}
          title="Revertir Asiento Contable"
          size="sm"
          footer={
            <div className="d-flex justify-content-end gap-2 w-100">
              <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => setReversingEntry(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger fw-semibold rounded-3"
                disabled={!reversalReason.trim()}
                onClick={handleConfirmReverse}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i> Revertir
              </button>
            </div>
          }
        >
          <div className="text-center py-2 mb-3">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 56, height: 56, background: 'rgba(239,68,68,0.1)' }}>
              <i className="bi bi-arrow-counterclockwise text-danger" style={{ fontSize: '1.5rem' }}></i>
            </div>
            <p className="text-muted fs-6 mb-0">
              Se generará un asiento de reversión por <strong>S/ {reversingEntry.amount.toFixed(2)}</strong>
            </p>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              ({reversingEntry.type === 'ingreso' ? 'Ingreso' : 'Egreso'}: "{reversingEntry.description}")
            </p>
          </div>
          <div>
            <label className="form-label">Motivo de reversión *</label>
            <input
              type="text"
              className="form-control rounded-3"
              placeholder="Ej. Error en el registro contable"
              value={reversalReason}
              onChange={e => setReversalReason(e.target.value)}
            />
          </div>
        </Modal>
      )}
    </>
  );
};

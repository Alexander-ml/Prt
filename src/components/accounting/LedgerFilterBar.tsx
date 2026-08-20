import React from 'react';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';
import { PERIOD_OPTIONS, type PeriodFilter } from './accountingMeta';
import type { LedgerCategory } from '../../types';
import type { DropdownOption } from '../common/CustomDropdownSelect';

interface LedgerFilterBarProps {
  periodFilter: PeriodFilter;
  onPeriodFilterChange: (value: PeriodFilter) => void;
  onExportReport: () => void;
  onCreateEntry: () => void;
  typeFilter: 'todos' | 'ingreso' | 'egreso';
  onTypeFilterChange: (value: 'todos' | 'ingreso' | 'egreso') => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  searchText: string;
  onSearchChange: (value: string) => void;
  ledgerCategories: LedgerCategory[];
}

const TYPE_OPTIONS: DropdownOption[] = [
  { value: 'todos', label: 'Todos', icon: 'bi-arrow-down-up', colorVariant: 'secondary' },
  { value: 'ingreso', label: 'Solo Ingresos', icon: 'bi-arrow-down-left-circle-fill', colorVariant: 'success' },
  { value: 'egreso', label: 'Solo Egresos', icon: 'bi-arrow-up-right-circle-fill', colorVariant: 'danger' },
];

export const LedgerFilterBar: React.FC<LedgerFilterBarProps> = ({
  periodFilter,
  onPeriodFilterChange,
  onExportReport,
  onCreateEntry,
  typeFilter,
  onTypeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  searchText,
  onSearchChange,
  ledgerCategories,
}) => {
  const categoryOptions: DropdownOption[] = [
    { value: '', label: 'Todas las categorías', icon: 'bi-tags', colorVariant: 'secondary' },
    ...ledgerCategories.map(cat => ({
      value: cat.id,
      label: cat.name,
      icon: 'bi-tag-fill',
      colorVariant: (cat.kind === 'ingreso' ? 'success' : cat.kind === 'egreso' ? 'danger' : 'secondary'),
    })),
  ];

  return (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      <div className="d-flex align-items-center gap-2 flex-wrap flex-grow-1">
        <div style={{ minWidth: 150 }}>
          <CustomDropdownSelect
            id="ledgerPeriodFilter"
            value={periodFilter}
            onChange={value => onPeriodFilterChange(value as PeriodFilter)}
            size="sm"
            options={PERIOD_OPTIONS}
          />
        </div>
        <div style={{ minWidth: 140 }}>
          <CustomDropdownSelect
            id="ledgerTypeFilter"
            value={typeFilter}
            onChange={value => onTypeFilterChange(value as 'todos' | 'ingreso' | 'egreso')}
            size="sm"
            options={TYPE_OPTIONS}
          />
        </div>
        <div style={{ minWidth: 180 }}>
          <CustomDropdownSelect
            id="ledgerCategoryFilter"
            value={categoryFilter}
            onChange={value => onCategoryFilterChange(value)}
            size="sm"
            options={categoryOptions}
          />
        </div>
        <div className="position-relative flex-grow-1" style={{ minWidth: 180, maxWidth: 240 }}>
          <i className="bi bi-search position-absolute" style={{ left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}></i>
          <input
            type="text"
            className="form-control form-control-sm rounded-3"
            style={{ paddingLeft: 30 }}
            placeholder="Buscar..."
            value={searchText}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="d-flex gap-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-primary fw-semibold rounded-3"
          onClick={onExportReport}
        >
          <i className="bi bi-download me-1"></i> Exportar
        </button>
        <button
          type="button"
          className="btn-brand btn btn-sm fw-semibold rounded-3"
          onClick={onCreateEntry}
        >
          <i className="bi bi-plus-lg me-1"></i> Nuevo Asiento
        </button>
      </div>
    </div>
  );
};

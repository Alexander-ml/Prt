import React from 'react';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';
import { PERIOD_OPTIONS, type PeriodFilter } from './accountingMeta';

interface LedgerFilterBarProps {
  periodFilter: PeriodFilter;
  onPeriodFilterChange: (value: PeriodFilter) => void;
  onExportReport: () => void;
  onCreateEntry: () => void;
}

/**
 * LedgerFilterBar — selector de período (ahora real, filtra de verdad) +
 * botones "Exportar Reporte" / "Nuevo Asiento". Se usa como `actions` del
 * `SectionCard` "Detalle de Ingresos y Egresos" en `LedgerView` — ambos
 * botones vivían antes en el `PageHeader` global de AccountingPage; bajan
 * acá, pegados a la lista que exportan/crean. Mismo criterio que
 * `InsumoFilterBar` (Inventario) y, más cerca todavía, el botón "Exportar"
 * de `HistoryView` (Ventas → Historial), pegado al `SectionCard`
 * "Historial de Ventas" en vez de compartir el header de la página.
 */
export const LedgerFilterBar: React.FC<LedgerFilterBarProps> = ({
  periodFilter,
  onPeriodFilterChange,
  onExportReport,
  onCreateEntry,
}) => {
  return (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      <div style={{ minWidth: 160 }}>
        <CustomDropdownSelect
          id="ledgerPeriodFilter"
          value={periodFilter}
          onChange={value => onPeriodFilterChange(value as PeriodFilter)}
          size="sm"
          options={PERIOD_OPTIONS}
        />
      </div>
      <button
        type="button"
        className="btn btn-sm btn-outline-primary fw-semibold"
        style={{ borderRadius: 8 }}
        onClick={onExportReport}
      >
        <i className="bi bi-download me-1"></i> Exportar Reporte
      </button>
      <button
        type="button"
        className="btn-brand btn btn-sm fw-semibold"
        style={{ borderRadius: 8 }}
        onClick={onCreateEntry}
      >
        <i className="bi bi-plus-lg me-1"></i> Nuevo Asiento
      </button>
    </div>
  );
};
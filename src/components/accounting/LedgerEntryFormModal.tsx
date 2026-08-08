import React from 'react';
import type { LedgerCategory } from '../../types';
import { Modal } from '../common/Modal';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';

/** Forma controlada del formulario de asiento. La dueña del estado es `LedgerView`. */
export interface LedgerEntryFormData {
  type: 'ingreso' | 'egreso';
  categoryId: string;
  description: string;
  amount: number;
  reference: string;
}

interface LedgerEntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: LedgerEntryFormData;
  onChange: (patch: Partial<LedgerEntryFormData>) => void;
  ledgerCategories: LedgerCategory[];
}

/**
 * LedgerEntryFormModal — Modal "Nuevo Asiento" (registro manual de un
 * ingreso o egreso). Componente controlado: no guarda estado propio ni
 * decide cómo se persiste el asiento — esa decisión la toma `LedgerView`.
 * Categoría usa `CustomDropdownSelect` alimentado por `ledgerCategories`,
 * filtrado por `kind` según el tipo elegido (Ingreso/Egreso) — reemplaza
 * el `<input type="text">` de texto libre que tenía el modal original
 * (ver diagnóstico de Contabilidad, Desventaja #5).
 */
export const LedgerEntryFormModal: React.FC<LedgerEntryFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  ledgerCategories,
}) => {
  const categoryOptions = ledgerCategories
    .filter(cat => cat.kind === formData.type || cat.kind === 'ambos')
    .map(cat => ({
      value: cat.id,
      label: cat.name,
      icon: 'bi-tag-fill',
      colorVariant: formData.type === 'ingreso' ? ('success' as const) : ('danger' as const),
    }));

  const handleTypeChange = (type: 'ingreso' | 'egreso') => {
    // Al cambiar de tipo, la categoría seleccionada puede dejar de aplicar
    // (una categoría de egreso no tiene sentido para un ingreso) — se
    // reinicia a la primera opción válida del nuevo tipo, igual criterio
    // que StockMovementModal al alternar Ingreso/Consumo en Inventario.
    const firstValid = ledgerCategories.find(cat => cat.kind === type || cat.kind === 'ambos');
    onChange({ type, categoryId: firstValid?.id ?? '' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Asiento Contable">
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label className="form-label">Tipo de Registro *</label>
          <div className="d-flex gap-2">
            <button
              type="button"
              className={`btn flex-grow-1 fw-semibold ${formData.type === 'ingreso' ? 'btn-success' : 'btn-outline-success'}`}
              style={{ borderRadius: 8 }}
              onClick={() => handleTypeChange('ingreso')}
            >
              <i className="bi bi-arrow-down-left-circle me-1"></i> Ingreso
            </button>
            <button
              type="button"
              className={`btn flex-grow-1 fw-semibold ${formData.type === 'egreso' ? 'btn-danger' : 'btn-outline-danger'}`}
              style={{ borderRadius: 8 }}
              onClick={() => handleTypeChange('egreso')}
            >
              <i className="bi bi-arrow-up-right-circle me-1"></i> Egreso
            </button>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label d-block">Categoría *</label>
          <CustomDropdownSelect
            value={formData.categoryId}
            onChange={value => onChange({ categoryId: value })}
            placeholder="Seleccione categoría..."
            options={categoryOptions}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Descripción *</label>
          <input
            type="text"
            className="form-control"
            style={{ borderRadius: 8 }}
            placeholder="Ej. Pago factura de verduras frescas"
            required
            value={formData.description}
            onChange={e => onChange({ description: e.target.value })}
          />
        </div>
        <div className="row g-3 mb-4">
          <div className="col-6">
            <label className="form-label">Monto (S/) *</label>
            <input
              type="number" step="0.5" min="0.1"
              className="form-control"
              style={{ borderRadius: 8 }}
              required
              value={formData.amount}
              onChange={e => onChange({ amount: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="col-6">
            <label className="form-label">Referencia / Comprobante</label>
            <input
              type="text"
              className="form-control"
              style={{ borderRadius: 8 }}
              value={formData.reference}
              onChange={e => onChange({ reference: e.target.value })}
            />
          </div>
        </div>
        <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
          <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }} disabled={!formData.categoryId}>
            Guardar Asiento
          </button>
        </div>
      </form>
    </Modal>
  );
};
import React from 'react';
import { Modal } from '../common/Modal';

/** Forma controlada del formulario de impuesto. La dueña del estado es `TaxesView`. */
export interface TaxFormData {
  name: string;
  percentage: number;
  active: boolean;
}

interface TaxFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  formData: TaxFormData;
  onChange: (patch: Partial<TaxFormData>) => void;
}

/**
 * TaxFormModal — Modal de alta/edición de un impuesto (RF-20, RF-21).
 * Componente controlado, sin estado propio: refleja `formData` y reporta
 * cambios hacia `TaxesView`, que es quien conoce `addTax`/`updateTax` del
 * AppContext — mismo patrón que `CategoryFormModal`.
 */
export const TaxFormModal: React.FC<TaxFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  formData,
  onChange,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Impuesto' : 'Registrar Impuesto'}
    >
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="taxNameInput" className="form-label">Nombre del Impuesto *</label>
          <input
            id="taxNameInput"
            type="text"
            className="form-control rounded-3"
            placeholder="Ej. IGV (18%)"
            required
            value={formData.name}
            onChange={e => onChange({ name: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="taxPercentageInput" className="form-label">Porcentaje (%) *</label>
          <input
            id="taxPercentageInput"
            type="number"
            step="0.1"
            min="0"
            className="form-control rounded-3"
            required
            value={formData.percentage}
            onChange={e => onChange({ percentage: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="form-check form-switch mb-4">
          <input
            className="form-check-input"
            type="checkbox"
            id="taxActiveSwitch"
            checked={formData.active}
            onChange={e => onChange({ active: e.target.checked })}
          />
          <label className="form-check-label fw-semibold tax-active-label" htmlFor="taxActiveSwitch">
            Impuesto Activo en Cálculo de Ventas
          </label>
        </div>
        <div className="d-flex justify-content-end gap-2 pt-2 border-top">
          <button type="button" className="btn btn-outline-secondary rounded-3" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-brand btn fw-semibold rounded-3">
            Guardar Impuesto
          </button>
        </div>
      </form>
    </Modal>
  );
};

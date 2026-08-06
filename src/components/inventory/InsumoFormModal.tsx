import React from 'react';
import type { InsumoCategory } from '../../types';
import { Modal } from '../common/Modal';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';
import { UNIT_OPTIONS } from './inventoryMeta';

/** Forma controlada del formulario de insumo. La dueña del estado es `InsumosView`. */
export interface InsumoFormData {
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  categoryId: string;
}

interface InsumoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  formData: InsumoFormData;
  onChange: (patch: Partial<InsumoFormData>) => void;
  insumoCategories: InsumoCategory[];
}

/**
 * InsumoFormModal — Modal de alta/edición de un insumo (RF-66, RF-67).
 * Componente controlado: no guarda estado propio del formulario, solo
 * refleja `formData` y reporta cambios vía `onChange`/`onSubmit`. No sabe
 * *cómo* se persiste un insumo — esa decisión (addInsumo vs updateInsumo)
 * la toma `InsumosView`. Unidad y Categoría usan `CustomDropdownSelect` en
 * vez de `<select>` nativo, mismo estándar que `DishFormModal`.
 */
export const InsumoFormModal: React.FC<InsumoFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  formData,
  onChange,
  insumoCategories,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Insumo' : 'Registrar Nuevo Insumo'}
      subtitle="Agrega o modifica insumos e ingredientes del catálogo."
    >
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="insumoNameInput" className="form-label">Nombre del Insumo *</label>
          <input
            id="insumoNameInput"
            type="text"
            className="form-control"
            placeholder="Ej. Lomo Fino de Res"
            required
            value={formData.name}
            style={{ borderRadius: 8 }}
            onChange={e => onChange({ name: e.target.value })}
          />
        </div>

        {/* Unidad + Categoría */}
        <div className="row g-3 mb-3">
          <div className="col-6">
            <label className="form-label d-block">Unidad de Medida *</label>
            <CustomDropdownSelect
              value={formData.unit}
              onChange={value => onChange({ unit: value })}
              size="sm"
              placeholder="Seleccione unidad..."
              options={UNIT_OPTIONS}
            />
          </div>
          <div className="col-6">
            <label className="form-label d-block">Categoría *</label>
            <CustomDropdownSelect
              value={formData.categoryId}
              onChange={value => onChange({ categoryId: value })}
              size="sm"
              placeholder="Seleccione categoría..."
              options={insumoCategories.map(cat => ({
                value: cat.id,
                label: cat.name,
                icon: 'bi-tag-fill',
                colorVariant: 'primary' as const,
              }))}
            />
          </div>
        </div>

        {/* Numeric fields */}
        <div className="row g-3 mb-4">
          <div className="col-4">
            <label htmlFor="insumoStockInput" className="form-label fs-7 fw-semibold text-dark">Stock Inicial</label>
            <input
              id="insumoStockInput"
              type="number"
              min="0"
              step="0.5"
              className="form-control"
              required
              value={formData.currentStock}
              style={{ borderRadius: 8 }}
              onChange={e => onChange({ currentStock: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="col-4">
            <label htmlFor="insumoMinStockInput" className="form-label fs-7 fw-semibold text-dark">Stock Mínimo</label>
            <input
              id="insumoMinStockInput"
              type="number"
              min="1"
              step="0.5"
              className="form-control"
              required
              value={formData.minStock}
              style={{ borderRadius: 8 }}
              onChange={e => onChange({ minStock: parseFloat(e.target.value) || 1 })}
            />
          </div>
          <div className="col-4">
            <label htmlFor="insumoCostInput" className="form-label fs-7 fw-semibold text-dark">Costo Un. (S/)</label>
            <input
              id="insumoCostInput"
              type="number"
              min="0"
              step="0.5"
              className="form-control"
              required
              value={formData.costPerUnit}
              style={{ borderRadius: 8 }}
              onChange={e => onChange({ costPerUnit: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 border-top pt-3">
          <button type="button" className="btn btn-light" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-brand fw-semibold" disabled={!formData.categoryId}>
            <i className="bi bi-check2 me-1" />
            Guardar Insumo
          </button>
        </div>
      </form>
    </Modal>
  );
};
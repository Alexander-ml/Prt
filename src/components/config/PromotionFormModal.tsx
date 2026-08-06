import React from 'react';
import type { Category, Dish, Promotion } from '../../types';
import { Modal } from '../common/Modal';
import { CustomDropdownSelect, type DropdownOption } from '../common/CustomDropdownSelect';
import { PROMOTION_TYPE_META, PROMOTION_TYPE_OPTIONS } from './configMeta';

/** Forma controlada del formulario de promoción. La dueña del estado es `PromotionsView`. */
export interface PromotionFormData {
  code: string;
  name: string;
  type: Promotion['type'];
  targetId: string;
  discountPercentage: number;
  active: boolean;
  startDate: string;
  endDate: string;
}

interface PromotionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  formData: PromotionFormData;
  onChange: (patch: Partial<PromotionFormData>) => void;
  categories: Category[];
  dishes: Dish[];
}

/**
 * PromotionFormModal — Modal de alta/edición de una promoción (RF-22,
 * RF-23). Componente controlado, sin estado propio: refleja `formData` y
 * reporta cambios hacia `PromotionsView`, que es quien conoce
 * `addPromotion`/`updatePromotion` del AppContext — mismo patrón que
 * `TaxFormModal`/`UserFormModal`.
 *
 * Los 3 selects (Alcance, Categoría target, Plato target) usan
 * `CustomDropdownSelect` en vez de `<select>` nativo, consistente con
 * `DishFormModal`/`UserFormModal`. El de Alcance sale de
 * `PROMOTION_TYPE_OPTIONS` (configMeta.ts) — sin cast `as any` en el
 * onChange, y sin necesidad de tocar este componente si se agrega un
 * alcance nuevo. Qué target mostrar (Categoría vs Plato) sale de
 * `PROMOTION_TYPE_META[formData.type].needsTarget`, reemplazando los 2 `if`
 * casi idénticos que existían antes.
 */
export const PromotionFormModal: React.FC<PromotionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  formData,
  onChange,
  categories,
  dishes,
}) => {
  const typeMeta = PROMOTION_TYPE_META[formData.type];

  const categoryOptions: DropdownOption[] = categories.map(c => ({ value: c.id, label: c.name }));
  const dishOptions: DropdownOption[] = dishes.map(d => ({ value: d.id, label: `${d.name} (S/ ${d.price})` }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Promoción' : 'Registrar Promoción'}
    >
      <form onSubmit={onSubmit}>
        <div className="row g-3 mb-3">
          <div className="col-8">
            <label htmlFor="promoNameInput" className="form-label">Nombre de Promoción *</label>
            <input
              id="promoNameInput"
              type="text"
              className="form-control"
              style={{ borderRadius: 8 }}
              placeholder="Ej. Happy Hour Cócteles"
              required
              value={formData.name}
              onChange={e => onChange({ name: e.target.value })}
            />
          </div>
          <div className="col-4">
            <label htmlFor="promoCodeInput" className="form-label">Código *</label>
            <input
              id="promoCodeInput"
              type="text"
              className="form-control font-monospace"
              style={{ borderRadius: 8 }}
              required
              value={formData.code}
              onChange={e => onChange({ code: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-6">
            <label id="promoTypeLabel" className="form-label">Alcance del Descuento *</label>
            <CustomDropdownSelect
              id="promoTypeSelect"
              labelId="promoTypeLabel"
              value={formData.type}
              onChange={v => onChange({ type: v as Promotion['type'] })}
              required
              options={PROMOTION_TYPE_OPTIONS}
            />
          </div>
          <div className="col-6">
            <label className="form-label">Descuento (%) *</label>
            <input
              type="number"
              min="1"
              max="100"
              className="form-control"
              style={{ borderRadius: 8 }}
              required
              value={formData.discountPercentage}
              onChange={e => onChange({ discountPercentage: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        {typeMeta.needsTarget && formData.type === 'category' && (
          <div className="mb-3">
            <label id="promoCategoryTargetLabel" className="form-label">Seleccionar Categoría Target</label>
            <CustomDropdownSelect
              id="promoCategoryTargetSelect"
              labelId="promoCategoryTargetLabel"
              value={formData.targetId}
              onChange={v => onChange({ targetId: v })}
              placeholder="Seleccione categoría..."
              options={categoryOptions}
            />
          </div>
        )}

        {typeMeta.needsTarget && formData.type === 'dish' && (
          <div className="mb-3">
            <label id="promoDishTargetLabel" className="form-label">Seleccionar Plato Target</label>
            <CustomDropdownSelect
              id="promoDishTargetSelect"
              labelId="promoDishTargetLabel"
              value={formData.targetId}
              onChange={v => onChange({ targetId: v })}
              placeholder="Seleccione plato..."
              options={dishOptions}
            />
          </div>
        )}

        <div className="row g-3 mb-4">
          <div className="col-6">
            <label className="form-label">Fecha Inicio</label>
            <input
              type="date"
              className="form-control"
              style={{ borderRadius: 8 }}
              value={formData.startDate}
              onChange={e => onChange({ startDate: e.target.value })}
            />
          </div>
          <div className="col-6">
            <label className="form-label">Fecha Fin</label>
            <input
              type="date"
              className="form-control"
              style={{ borderRadius: 8 }}
              value={formData.endDate}
              onChange={e => onChange({ endDate: e.target.value })}
            />
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 pt-2 border-top">
          <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }}>
            Guardar Promoción
          </button>
        </div>
      </form>
    </Modal>
  );
};
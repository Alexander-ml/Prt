import React from 'react';
import type { Category, DishRecipeItem, Insumo, KitchenStation } from '../../types';
import { Modal } from '../common/Modal';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';
import { KITCHEN_STATION_META, KITCHEN_STATION_ORDER } from '../kitchen/kitchenMeta';
import { DishRecipeEditor } from './DishRecipeEditor';

/** Forma controlada del formulario de plato. La dueña del estado es `DishesView`. */
export interface DishFormData {
  name: string;
  categoryId: string;
  price: number;
  description: string;
  image: string;
  active: boolean;
  isAvailableToday: boolean;
  // Estación de cocina y tiempo estimado alimentan directamente el KDS
  // (agrupación "Por Estación" y el umbral de urgencia real por plato).
  station: KitchenStation;
  prepTimeMinutes: number;
  // Se captura como texto separado por comas y se convierte a array al guardar.
  allergensText: string;
  // Vínculo Catálogo↔Inventario (RF-66+): insumos que consume una unidad
  // servida del plato. OPCIONAL — un plato sin líneas de receta sigue
  // funcionando exactamente igual que antes en Cocina y Pedidos.
  recipe: DishRecipeItem[];
}

interface DishFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  formData: DishFormData;
  onChange: (patch: Partial<DishFormData>) => void;
  categories: Category[];
  /** Insumos disponibles para vincular en la receta (sección "Insumos Utilizados"). */
  insumos: Insumo[];
}

/**
 * DishFormModal — Modal de alta/edición de un plato (RF-11, RF-12).
 * Componente controlado: no guarda estado propio del formulario, solo
 * refleja `formData` y reporta cambios vía `onChange`/`onSubmit`. No sabe
 * *cómo* se persiste un plato — esa decisión (addDish vs updateDish) la
 * toma `DishesView`, que es quien conoce el AppContext.
 */
export const DishFormModal: React.FC<DishFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  formData,
  onChange,
  categories,
  insumos,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Plato del Catálogo' : 'Registrar Nuevo Plato'}
      size="lg"
    >
      <form onSubmit={onSubmit}>
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-8">
            <label htmlFor="dishNameInput" className="form-label">Nombre del Plato *</label>
            <input
              id="dishNameInput"
              type="text"
              className="form-control rounded-3"
              placeholder="Ej. Ceviche Mixto Especial"
              required
              value={formData.name}
              onChange={e => onChange({ name: e.target.value })}
            />
          </div>
          <div className="col-12 col-md-4">
            <label htmlFor="dishPriceInput" className="form-label">Precio (S/) *</label>
            <div className="input-group">
              <span className="input-group-text">S/</span>
              <input
                id="dishPriceInput"
                type="number"
                step="0.5"
                min="0"
                className="form-control rounded-end-3"
                required
                value={formData.price}
                onChange={e => onChange({ price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label className="form-label d-block">Categoría *</label>
            <CustomDropdownSelect
              value={formData.categoryId}
              onChange={value => onChange({ categoryId: value })}
              placeholder="Seleccione categoría..."
              options={categories.map(c => ({
                value: c.id,
                label: c.name,
                icon: 'bi-tag-fill',
                colorVariant: 'primary' as const,
              }))}
            />
          </div>
          <div className="col-12 col-md-6">
            <label htmlFor="dishImageInput" className="form-label">URL de Imagen</label>
            <input
              id="dishImageInput"
              type="url"
              className="form-control rounded-3"
              placeholder="https://..."
              value={formData.image}
              onChange={e => onChange({ image: e.target.value })}
            />
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="dishDescInput" className="form-label">Descripción del Plato</label>
          <textarea
            id="dishDescInput"
            className="form-control rounded-3"
            rows={3}
            placeholder="Ingredientes, preparación o detalles de presentación..."
            value={formData.description}
            onChange={e => onChange({ description: e.target.value })}
          ></textarea>
        </div>

        {/* Datos que alimentan directamente el Kitchen Display System (KDS):
            estación responsable, tiempo estimado y alérgenos. */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-5">
            <label className="form-label d-block">Estación de Cocina (KDS) *</label>
            <CustomDropdownSelect
              value={formData.station}
              onChange={value => onChange({ station: value as KitchenStation })}
              placeholder="Seleccione estación..."
              options={KITCHEN_STATION_ORDER.map(station => ({
                value: station,
                label: KITCHEN_STATION_META[station].label,
                icon: KITCHEN_STATION_META[station].icon,
                colorVariant: KITCHEN_STATION_META[station].colorTheme,
              }))}
            />
          </div>
          <div className="col-12 col-md-3">
            <label htmlFor="dishPrepTimeInput" className="form-label">Tiempo Prep. (min) *</label>
            <input
              id="dishPrepTimeInput"
              type="number"
              min="1"
              step="1"
              className="form-control rounded-3"
              required
              value={formData.prepTimeMinutes}
              onChange={e => onChange({ prepTimeMinutes: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
          <div className="col-12 col-md-4">
            <label htmlFor="dishAllergensInput" className="form-label">Alérgenos</label>
            <input
              id="dishAllergensInput"
              type="text"
              className="form-control rounded-3"
              placeholder="Ej. Gluten, Lácteos"
              value={formData.allergensText}
              onChange={e => onChange({ allergensText: e.target.value })}
            />
            <div className="form-text">Separados por comas. Se muestran fijos en el ticket de cocina.</div>
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label d-block mb-1">Insumos Utilizados (Receta) — Opcional</label>
          <p className="form-text mt-0 mb-2">
            Vincula los insumos y la cantidad por porción que consume este plato. Si configuras esto, el sistema
            descontará stock real de Inventario automáticamente cada vez que Cocina marque una unidad del plato
            como "Listo".
          </p>
          <DishRecipeEditor
            insumos={insumos}
            recipe={formData.recipe}
            onChange={recipe => onChange({ recipe })}
          />
        </div>

        <div className="d-flex justify-content-end gap-2 pt-3 border-top">
          <button type="button" className="btn btn-outline-secondary rounded-3" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-brand btn fw-semibold rounded-3">
            {isEditing ? 'Guardar Cambios' : 'Registrar Plato'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
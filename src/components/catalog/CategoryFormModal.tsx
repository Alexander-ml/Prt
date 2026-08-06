import React from 'react';
import { Modal } from '../common/Modal';

/** Forma controlada del formulario de categoría. La dueña del estado es `CategoriesView`. */
export interface CategoryFormData {
  name: string;
  description: string;
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  formData: CategoryFormData;
  onChange: (patch: Partial<CategoryFormData>) => void;
}

/**
 * CategoryFormModal — Modal de alta/edición de una categoría (RF-08, RF-09).
 * Componente controlado, sin estado propio: refleja `formData` y reporta
 * cambios hacia `CategoriesView`, que es quien conoce `addCategory`/
 * `updateCategory` del AppContext.
 */
export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
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
      title={isEditing ? 'Editar Categoría' : 'Crear Nueva Categoría'}
    >
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="catNameInput" className="form-label">Nombre de Categoría *</label>
          <input
            id="catNameInput"
            type="text"
            className="form-control rounded-3"
            placeholder="Ej. Sopas y Cremas"
            required
            value={formData.name}
            onChange={e => onChange({ name: e.target.value })}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="catDescInput" className="form-label">Descripción</label>
          <input
            id="catDescInput"
            type="text"
            className="form-control rounded-3"
            placeholder="Breve descripción funcional..."
            value={formData.description}
            onChange={e => onChange({ description: e.target.value })}
          />
        </div>
        <div className="d-flex justify-content-end gap-2 pt-2 border-top">
          <button type="button" className="btn btn-outline-secondary rounded-3" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-brand btn fw-semibold rounded-3">
            {isEditing ? 'Guardar Categoría' : 'Crear Categoría'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
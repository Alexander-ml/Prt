import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { InsumoCategory } from '../../types';
import { SectionCard } from '../common/SectionCard';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface InsumoCategoryFormData {
  name: string;
  description: string;
}

const EMPTY_FORM: InsumoCategoryFormData = { name: '', description: '' };

/**
 * InsumoCategoriesView — Pestaña "Categorías" del módulo Inventario.
 * Réplica exacta del patrón de `CategoriesView` (Catálogo): dueña de su
 * propio estado (modal de categoría, confirmación de borrado), lee
 * `useApp()` directamente. Resuelve de raíz el bug de categorías
 * hardcodeadas — una categoría nueva es una fila más, no un cambio de
 * código (ver diagnóstico de Inventario, Desventaja #2).
 *
 * El conteo de insumos asociados se calcula en vivo contra `insumos`, con
 * el mismo criterio que `CategoryTable` usa para platos — no se confía en
 * el campo denormalizado `insumoCount` para lo que se muestra en pantalla.
 */
export const InsumoCategoriesView: React.FC = () => {
  const { insumos, insumoCategories, addInsumoCategory, updateInsumoCategory, deleteInsumoCategory } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InsumoCategory | null>(null);
  const [formData, setFormData] = useState<InsumoCategoryFormData>(EMPTY_FORM);
  const [deletingCategory, setDeletingCategory] = useState<InsumoCategory | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCategory) {
      updateInsumoCategory(editingCategory.id, formData.name, formData.description);
    } else {
      addInsumoCategory(formData.name, formData.description);
    }
    setIsModalOpen(false);
  };

  const handleOpenModal = (cat?: InsumoCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({ name: cat.name, description: cat.description });
    } else {
      setEditingCategory(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <SectionCard
        icon="bi-tags-fill"
        title="Categorías de Insumo"
        noPadding
        actions={
          <button
            type="button"
            className="btn-brand btn btn-sm fw-semibold rounded-3"
            onClick={() => handleOpenModal()}
          >
            <i className="bi bi-folder-plus me-1" aria-hidden="true"></i> Nueva Categoría
          </button>
        }
      >
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ minWidth: 600 }}>
            <thead className="table-light">
              <tr>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Insumos Asociados</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {insumoCategories.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState icon="bi-tags" title="Aún no hay categorías de insumo configuradas" />
                  </td>
                </tr>
              ) : (
                insumoCategories.map(cat => {
                  const associatedCount = insumos.filter(i => i.categoryId === cat.id).length;
                  return (
                    <tr key={cat.id}>
                      <td>
                        <div className="fw-bold text-dark">
                          <i className="bi bi-tag-fill me-2 text-muted" aria-hidden="true"></i>
                          {cat.name}
                        </div>
                      </td>
                      <td>
                        <span className="small text-muted">{cat.description || 'Sin descripción'}</span>
                      </td>
                      <td>
                        <Badge status={`${associatedCount} insumos`} variant="primary" />
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-1">
                          <button
                            type="button"
                            className="btn-icon btn-icon-primary"
                            aria-label={`Editar categoría ${cat.name}`}
                            onClick={() => handleOpenModal(cat)}
                          >
                            <i className="bi bi-pencil-fill" aria-hidden="true"></i>
                          </button>
                          <button
                            type="button"
                            className="btn-icon btn-icon-danger"
                            aria-label={`Eliminar categoría ${cat.name}`}
                            onClick={() => setDeletingCategory(cat)}
                          >
                            <i className="bi bi-trash-fill" aria-hidden="true"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Editar Categoría de Insumo' : 'Crear Categoría de Insumo'}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="insumoCatNameInput" className="form-label">Nombre de Categoría *</label>
            <input
              id="insumoCatNameInput"
              type="text"
              className="form-control rounded-3"
              placeholder="Ej. Especiales"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="insumoCatDescInput" className="form-label">Descripción</label>
            <input
              id="insumoCatDescInput"
              type="text"
              className="form-control rounded-3"
              placeholder="Breve descripción funcional..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-brand btn fw-semibold rounded-3">
              {editingCategory ? 'Guardar Categoría' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </Modal>

      {deletingCategory && (
        <ConfirmModal
          isOpen={!!deletingCategory}
          onClose={() => setDeletingCategory(null)}
          onConfirm={() => deleteInsumoCategory(deletingCategory.id)}
          title="Eliminar Categoría de Insumo"
          message={`¿Desea eliminar la categoría "${deletingCategory.name}"? Solo es posible eliminar categorías sin insumos asociados.`}
          variant="danger"
          confirmText="Eliminar Categoría"
        />
      )}
    </>
  );
};
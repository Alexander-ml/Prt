import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { LedgerCategory } from '../../types';
import { SectionCard } from '../common/SectionCard';
import { ConfirmModal } from '../common/ConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';

interface LedgerCategoryFormData {
  name: string;
  kind: LedgerCategory['kind'];
  description: string;
}

const EMPTY_FORM: LedgerCategoryFormData = { name: '', kind: 'egreso', description: '' };

const KIND_OPTIONS = [
  { value: 'ingreso', label: 'Solo Ingreso', icon: 'bi-arrow-down-left-circle-fill', colorVariant: 'success' },
  { value: 'egreso', label: 'Solo Egreso', icon: 'bi-arrow-up-right-circle-fill', colorVariant: 'danger' },
  { value: 'ambos', label: 'Ingreso y Egreso', icon: 'bi-arrow-down-up', colorVariant: 'secondary' },
];

const KIND_BADGE: Record<LedgerCategory['kind'], { label: string; variant: 'success' | 'danger' | 'secondary' }> = {
  ingreso: { label: 'Ingreso', variant: 'success' },
  egreso: { label: 'Egreso', variant: 'danger' },
  ambos: { label: 'Ingreso / Egreso', variant: 'secondary' },
};

/**
 * LedgerCategoriesView — Pestaña "Categorías Contables" del módulo
 * Contabilidad. Réplica exacta del patrón de `InsumoCategoriesView`
 * (Inventario): dueña de su propio estado (modal de categoría,
 * confirmación de borrado), lee `useApp()` directamente. Resuelve de raíz
 * el bug de la categoría de asiento como texto libre — una categoría
 * nueva es una fila más, no un valor distinto tipeado a mano cada vez
 * (ver diagnóstico de Contabilidad, Desventaja #5).
 *
 * El conteo de asientos asociados se calcula en vivo contra
 * `ledgerEntries`, mismo criterio que `InsumoCategoriesView` usa para
 * insumos — no se confía en el campo denormalizado `entryCount` para lo
 * que se muestra en pantalla.
 */
export const LedgerCategoriesView: React.FC = () => {
  const { ledgerEntries, ledgerCategories, addLedgerCategory, updateLedgerCategory, deleteLedgerCategory } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<LedgerCategory | null>(null);
  const [formData, setFormData] = useState<LedgerCategoryFormData>(EMPTY_FORM);
  const [deletingCategory, setDeletingCategory] = useState<LedgerCategory | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCategory) {
      updateLedgerCategory(editingCategory.id, formData.name, formData.kind, formData.description);
    } else {
      addLedgerCategory(formData.name, formData.kind, formData.description);
    }
    setIsModalOpen(false);
  };

  const handleOpenModal = (cat?: LedgerCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({ name: cat.name, kind: cat.kind, description: cat.description });
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
        title="Categorías Contables"
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
        <div className="table-responsive-x">
          <table className="custom-table" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Asientos Asociados</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ledgerCategories.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState icon="bi-tags" title="Aún no hay categorías contables configuradas" />
                  </td>
                </tr>
              ) : (
                ledgerCategories.map(cat => {
                  const associatedCount = ledgerEntries.filter(e => e.categoryId === cat.id).length;
                  const kindMeta = KIND_BADGE[cat.kind];
                  return (
                    <tr key={cat.id}>
                      <td>
                        <div className="fw-bold text-dark">
                          <i className="bi bi-tag-fill me-2 text-muted" aria-hidden="true"></i>
                          {cat.name}
                        </div>
                      </td>
                      <td>
                        <Badge status={kindMeta.label} variant={kindMeta.variant} />
                      </td>
                      <td>
                        <span className="small text-muted">{cat.description || 'Sin descripción'}</span>
                      </td>
                      <td>
                        <Badge status={`${associatedCount} asientos`} variant="primary" />
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
        title={editingCategory ? 'Editar Categoría Contable' : 'Crear Categoría Contable'}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="ledgerCatNameInput" className="form-label">Nombre de Categoría *</label>
            <input
              id="ledgerCatNameInput"
              type="text"
              className="form-control rounded-3"
              placeholder="Ej. Marketing y Publicidad"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label d-block">Aplica a *</label>
            <CustomDropdownSelect
              value={formData.kind}
              onChange={value => setFormData({ ...formData, kind: value as LedgerCategory['kind'] })}
              options={KIND_OPTIONS}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="ledgerCatDescInput" className="form-label">Descripción</label>
            <input
              id="ledgerCatDescInput"
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
          onConfirm={() => deleteLedgerCategory(deletingCategory.id)}
          title="Eliminar Categoría Contable"
          message={`¿Desea eliminar la categoría "${deletingCategory.name}"? Solo es posible eliminar categorías sin asientos asociados.`}
          variant="danger"
          confirmText="Eliminar Categoría"
        />
      )}
    </>
  );
};
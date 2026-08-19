import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Category } from '../../types';
import { SectionCard } from '../common/SectionCard';
import { ConfirmModal } from '../common/ConfirmModal';
import { CategoryTable } from './CategoryTable';
import { CategoryFormModal, type CategoryFormData } from './CategoryFormModal';

const EMPTY_CATEGORY_FORM: CategoryFormData = { name: '', description: '' };

/**
 * CategoriesView — Pestaña "Categorías" del Catálogo (RF-08 a RF-10).
 * Dueña de su propio estado (modal de categoría, confirmación de borrado) y
 * lee `useApp()` directamente — igual que `DishesView` y que
 * `TablesConfigView` en el módulo de Mesas. Independiente de Platos: no
 * comparte estado de filtros ni de formulario con `DishesView`.
 */
export const CategoriesView: React.FC = () => {
  const { categories, dishes, addCategory, updateCategory, deleteCategory, currentRole } = useApp();
  const isAdmin = currentRole === 'Administrador';

  // Category Modal state (RF-08, RF-09)
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catFormData, setCatFormData] = useState<CategoryFormData>(EMPTY_CATEGORY_FORM);

  // Delete Confirm Category (RF-10)
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);

  const handleCategoryFormChange = (patch: Partial<CategoryFormData>) => {
    setCatFormData(prev => ({ ...prev, ...patch }));
  };

  // Handle Category submission
  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormData.name.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, catFormData.name, catFormData.description);
    } else {
      addCategory(catFormData.name, catFormData.description);
    }
    setIsCatModalOpen(false);
  };

  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCatFormData({ name: cat.name, description: cat.description });
    } else {
      setEditingCategory(null);
      setCatFormData(EMPTY_CATEGORY_FORM);
    }
    setIsCatModalOpen(true);
  };

  return (
    <>
      <SectionCard
        icon="bi-tags-fill"
        title="Categorías del Menú"
        noPadding
        className="catalog-categories-card"
        actions={
          isAdmin && (
            <button
              type="button"
              className="btn-brand btn btn-sm fw-semibold rounded-3"
              onClick={() => handleOpenCategoryModal()}
            >
              <i className="bi bi-folder-plus me-1" aria-hidden="true"></i> Nueva Categoría
            </button>
          )
        }
      >
        <CategoryTable
          categories={categories}
          dishes={dishes}
          isAdmin={isAdmin}
          onEdit={handleOpenCategoryModal}
          onDelete={setDeletingCat}
        />
      </SectionCard>

      <CategoryFormModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        onSubmit={handleCategorySubmit}
        isEditing={!!editingCategory}
        formData={catFormData}
        onChange={handleCategoryFormChange}
      />

      {/* Delete Category Confirmation */}
      {deletingCat && (
        <ConfirmModal
          isOpen={!!deletingCat}
          onClose={() => setDeletingCat(null)}
          onConfirm={() => deleteCategory(deletingCat.id)}
          title="Eliminar Categoría"
          message={`¿Desea eliminar la categoría "${deletingCat.name}"? Solo es posible eliminar categorías sin platos asociados.`}
          variant="danger"
          confirmText="Eliminar Categoría"
        />
      )}
    </>
  );
};

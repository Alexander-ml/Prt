import React from 'react';
import type { Category, Dish } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';

interface CategoryTableProps {
  categories: Category[];
  /** Se usa solo para contar platos asociados por categoría, no se muta. */
  dishes: Dish[];
  isAdmin: boolean;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

/**
 * CategoryTable — Tabla de categorías del menú, presentacional pura.
 * No recibe manejadores de platos ni de su formulario — solo lo necesario
 * para listar categorías y disparar edición/borrado (Interface Segregation).
 *
 * Incluye `EmptyState` cuando no hay categorías configuradas, igual que
 * `TablesConfigView` hace para Áreas y Mesas.
 */
export const CategoryTable: React.FC<CategoryTableProps> = ({ categories, dishes, isAdmin, onEdit, onDelete }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0" style={{ minWidth: 600 }}>
        <thead className="table-light">
          <tr>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Platos Asociados</th>
            {isAdmin && <th className="text-end">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 4 : 3}>
                <EmptyState icon="bi-tags" title="Aún no hay categorías configuradas" />
              </td>
            </tr>
          ) : (
            categories.map(cat => {
              const associatedCount = dishes.filter(d => d.categoryId === cat.id).length;
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
                    <Badge status={`${associatedCount} platos`} variant="primary" />
                  </td>
                  {isAdmin && (
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        <button
                          type="button"
                          className="btn-icon btn-icon-primary"
                          aria-label={`Editar categoría ${cat.name}`}
                          onClick={() => onEdit(cat)}
                        >
                          <i className="bi bi-pencil-fill" aria-hidden="true"></i>
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-icon-danger"
                          aria-label={`Eliminar categoría ${cat.name}`}
                          onClick={() => onDelete(cat)}
                        >
                          <i className="bi bi-trash-fill" aria-hidden="true"></i>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Dish, Category } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { EmptyState } from '../components/common/EmptyState';

export const CatalogPage: React.FC = () => {
  const {
    categories,
    dishes,
    addCategory,
    updateCategory,
    deleteCategory,
    addDish,
    updateDish,
    toggleDishActive,
    currentRole
  } = useApp();

  const isAdmin = currentRole === 'Administrador';

  // Search & Filter state (RF-14, RF-15)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('todos');

  // Category Tab / Manage state
  const [activeTab, setActiveTab] = useState<'platos' | 'categorias'>('platos');

  // Dish Modal state (RF-11, RF-12)
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [dishFormData, setDishFormData] = useState({
    name: '',
    categoryId: '',
    price: 0,
    description: '',
    image: '',
    active: true,
    isAvailableToday: true
  });

  // Category Modal state (RF-08, RF-09)
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catFormData, setCatFormData] = useState({
    name: '',
    description: ''
  });

  // Delete Confirm Category (RF-10)
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);

  // Filtered Dishes (RF-14, RF-15, RF-16)
  const filteredDishes = useMemo(() => {
    return dishes.filter(dish => {
      const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            dish.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'todas' || dish.categoryId === selectedCategory;
      const matchesAvail = selectedAvailability === 'todos' ||
                           (selectedAvailability === 'activos' && dish.active) ||
                           (selectedAvailability === 'inactivos' && !dish.active) ||
                           (selectedAvailability === 'disponibles_hoy' && dish.isAvailableToday);
      return matchesSearch && matchesCat && matchesAvail;
    });
  }, [dishes, searchQuery, selectedCategory, selectedAvailability]);

  // Handle Dish submission
  const handleDishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishFormData.name.trim() || !dishFormData.categoryId) return;

    if (editingDish) {
      updateDish(editingDish.id, {
        name: dishFormData.name,
        categoryId: dishFormData.categoryId,
        price: Number(dishFormData.price),
        description: dishFormData.description,
        image: dishFormData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        active: dishFormData.active,
        isAvailableToday: dishFormData.isAvailableToday
      });
    } else {
      addDish({
        name: dishFormData.name,
        categoryId: dishFormData.categoryId,
        price: Number(dishFormData.price),
        description: dishFormData.description,
        image: dishFormData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        active: true,
        isAvailableToday: true
      });
    }
    setIsDishModalOpen(false);
  };

  // Open Dish Modal
  const handleOpenDishModal = (dish?: Dish) => {
    if (dish) {
      setEditingDish(dish);
      setDishFormData({
        name: dish.name,
        categoryId: dish.categoryId,
        price: dish.price,
        description: dish.description,
        image: dish.image,
        active: dish.active,
        isAvailableToday: dish.isAvailableToday
      });
    } else {
      setEditingDish(null);
      setDishFormData({
        name: '',
        categoryId: categories[0]?.id || '',
        price: 30,
        description: '',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        active: true,
        isAvailableToday: true
      });
    }
    setIsDishModalOpen(true);
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
      setCatFormData({ name: '', description: '' });
    }
    setIsCatModalOpen(true);
  };

  return (
    <div className="container-fluid p-0">
      {/* Title & Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold text-dark mb-1">
            <i className="bi bi-book-half text-primary me-2"></i>
            Gestión del Catálogo y Menú
          </h4>
          <p className="text-muted fs-7 mb-0">
            Fuente única de información sobre platos, categorías, precios y disponibilidad (RF-08 - RF-16).
          </p>
        </div>
        {isAdmin && (
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-primary btn-md fw-semibold shadow-sm"
              onClick={() => handleOpenCategoryModal()}
            >
              <i className="bi bi-folder-plus me-1.5"></i> Nueva Categoría
            </button>
            <button
              className="btn btn-brand btn-md fw-semibold shadow-sm"
              onClick={() => handleOpenDishModal()}
            >
              <i className="bi bi-plus-lg me-1.5"></i> Registrar Plato
            </button>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <ul className="nav nav-tabs mb-4 border-bottom">
        <li className="nav-item">
          <button
            className={`nav-link fw-semibold px-4 py-2.5 ${activeTab === 'platos' ? 'active text-primary border-primary border-bottom-0' : 'text-muted'}`}
            onClick={() => setActiveTab('platos')}
          >
            <i className="bi bi-egg-fried me-2"></i> Platos y Carta ({dishes.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-semibold px-4 py-2.5 ${activeTab === 'categorias' ? 'active text-primary border-primary border-bottom-0' : 'text-muted'}`}
            onClick={() => setActiveTab('categorias')}
          >
            <i className="bi bi-tags-fill me-2"></i> Categorías ({categories.length})
          </button>
        </li>
      </ul>

      {activeTab === 'platos' ? (
        <>
          {/* Filters Card */}
          <div className="card glass-card border-0 mb-4 p-3">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-5">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Buscar plato por nombre o descripción (RF-14)..."
                />
              </div>
              <div className="col-12 col-sm-6 col-md-3">
                <select
                  className="form-select rounded-3 border-secondary-subtle fs-7 fw-medium shadow-none"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="todas">Todas las Categorías (RF-15)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-sm-6 col-md-4">
                <select
                  className="form-select rounded-3 border-secondary-subtle fs-7 fw-medium shadow-none"
                  value={selectedAvailability}
                  onChange={e => setSelectedAvailability(e.target.value)}
                >
                  <option value="todos">Todos los Estados (RF-15)</option>
                  <option value="activos">Activos en Menú Permanente</option>
                  <option value="disponibles_hoy">Disponibles Hoy para Cocina</option>
                  <option value="inactivos">Desactivados del Menú</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dish Cards Grid (RF-16) */}
          {filteredDishes.length === 0 ? (
            <EmptyState
              icon="bi-journal-x"
              title="No hay platos que coincidan"
              description="Ajusta los filtros de búsqueda o registra nuevos platos en el catálogo."
              actionText={isAdmin ? 'Registrar Primer Plato' : undefined}
              onAction={isAdmin ? () => handleOpenDishModal() : undefined}
            />
          ) : (
            <div className="row g-4 mb-4">
              {filteredDishes.map(dish => (
                <div key={dish.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                  <div className="card glass-card border-0 h-100 overflow-hidden d-flex flex-column">
                    <div className="position-relative" style={{ height: 160, overflow: 'hidden' }}>
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-100 h-100 object-fit-cover"
                      />
                      <div className="position-absolute top-0 start-0 m-2 d-flex flex-column gap-1">
                        <Badge status={dish.categoryName} variant="dark" />
                      </div>
                      <div className="position-absolute top-0 end-0 m-2">
                        <Badge
                          status={dish.active ? 'Menú Activo' : 'Desactivado'}
                          variant={dish.active ? 'success' : 'secondary'}
                        />
                      </div>
                    </div>

                    <div className="card-body p-3.5 d-flex flex-column flex-grow-1">
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                        <h6 className="fw-bold text-dark mb-0 line-clamp-1">{dish.name}</h6>
                        <span className="fw-extrabold text-primary fs-6">S/ {dish.price.toFixed(2)}</span>
                      </div>
                      <p className="text-muted fs-7 line-clamp-2 mb-3 flex-grow-1" style={{ fontSize: '0.825rem' }}>
                        {dish.description}
                      </p>

                      <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                        <div>
                          <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Cocina Hoy:</small>
                          <Badge
                            status={dish.isAvailableToday ? 'Disponible' : 'Agotado'}
                            variant={dish.isAvailableToday ? 'info' : 'warning'}
                          />
                        </div>

                        {isAdmin && (
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-sm btn-light border text-primary"
                              title="Editar Plato (RF-12)"
                              onClick={() => handleOpenDishModal(dish)}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              className={`btn btn-sm ${dish.active ? 'btn-light text-danger' : 'btn-light text-success'} border`}
                              title={dish.active ? 'Desactivar del Menú (RF-13)' : 'Activar en Menú'}
                              onClick={() => toggleDishActive(dish.id)}
                            >
                              <i className={`bi ${dish.active ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Categories Table (RF-08, RF-09, RF-10) */
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Platos Asociados</th>
                {isAdmin && <th className="text-end">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => {
                const associatedCount = dishes.filter(d => d.categoryId === cat.id).length;
                return (
                  <tr key={cat.id}>
                    <td>
                      <div className="fw-bold text-dark">{cat.name}</div>
                    </td>
                    <td>
                      <span className="text-muted fs-7">{cat.description || 'Sin descripción'}</span>
                    </td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary fw-semibold px-2.5 py-1 rounded-pill">
                        {associatedCount} platos
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="text-end">
                        <div className="d-inline-flex gap-1">
                          <button
                            className="btn btn-sm btn-light text-primary border"
                            title="Editar Categoría (RF-09)"
                            onClick={() => handleOpenCategoryModal(cat)}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-light text-danger border"
                            title="Eliminar Categoría (RF-10)"
                            onClick={() => setDeletingCat(cat)}
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dish Modal (RF-11, RF-12) */}
      <Modal
        isOpen={isDishModalOpen}
        onClose={() => setIsDishModalOpen(false)}
        title={editingDish ? 'Editar Plato del Catálogo (RF-12)' : 'Registrar Nuevo Plato (RF-11)'}
        size="lg"
      >
        <form onSubmit={handleDishSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-8">
              <label className="form-label fs-7 fw-semibold text-dark">Nombre del Plato *</label>
              <input
                type="text"
                className="form-control rounded-3"
                placeholder="Ej. Ceviche Mixto Especial"
                required
                value={dishFormData.name}
                onChange={e => setDishFormData({ ...dishFormData, name: e.target.value })}
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label fs-7 fw-semibold text-dark">Precio (S/) *</label>
              <input
                type="number"
                step="0.5"
                min="0"
                className="form-control rounded-3"
                required
                value={dishFormData.price}
                onChange={e => setDishFormData({ ...dishFormData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label fs-7 fw-semibold text-dark">Categoría *</label>
              <select
                className="form-select rounded-3"
                required
                value={dishFormData.categoryId}
                onChange={e => setDishFormData({ ...dishFormData, categoryId: e.target.value })}
              >
                <option value="" disabled>Seleccione categoría...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fs-7 fw-semibold text-dark">URL de Imagen</label>
              <input
                type="url"
                className="form-control rounded-3"
                placeholder="https://..."
                value={dishFormData.image}
                onChange={e => setDishFormData({ ...dishFormData, image: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fs-7 fw-semibold text-dark">Descripción del Plato</label>
            <textarea
              className="form-control rounded-3"
              rows={3}
              placeholder="Ingredientes, preparación o detalles de presentación..."
              value={dishFormData.description}
              onChange={e => setDishFormData({ ...dishFormData, description: e.target.value })}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-3 border-top">
            <button type="button" className="btn btn-light fw-medium" onClick={() => setIsDishModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-brand fw-semibold">
              {editingDish ? 'Guardar Cambios' : 'Registrar Plato'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Modal (RF-08, RF-09) */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCategory ? 'Editar Categoría (RF-09)' : 'Crear Nueva Categoría (RF-08)'}
      >
        <form onSubmit={handleCategorySubmit}>
          <div className="mb-3">
            <label className="form-label fs-7 fw-semibold text-dark">Nombre de Categoría *</label>
            <input
              type="text"
              className="form-control rounded-3"
              placeholder="Ej. Sopas y Cremas"
              required
              value={catFormData.name}
              onChange={e => setCatFormData({ ...catFormData, name: e.target.value })}
            />
          </div>

          <div className="mb-4">
            <label className="form-label fs-7 fw-semibold text-dark">Descripción</label>
            <input
              type="text"
              className="form-control rounded-3"
              placeholder="Breve descripción funcional..."
              value={catFormData.description}
              onChange={e => setCatFormData({ ...catFormData, description: e.target.value })}
            />
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-light fw-medium" onClick={() => setIsCatModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-brand fw-semibold">
              {editingCategory ? 'Guardar Categoría' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Category Confirmation (RF-10) */}
      {deletingCat && (
        <ConfirmModal
          isOpen={!!deletingCat}
          onClose={() => setDeletingCat(null)}
          onConfirm={() => deleteCategory(deletingCat.id)}
          title="Eliminar Categoría (RF-10)"
          message={`¿Desea eliminar la categoría "${deletingCat.name}"? Solo es posible eliminar categorías sin platos asociados.`}
          variant="danger"
          confirmText="Eliminar Categoría"
        />
      )}
    </div>
  );
};

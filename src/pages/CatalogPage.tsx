import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Dish, Category } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { StatCard } from '../components/common/StatCard';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { EmptyState } from '../components/common/EmptyState';
import { CustomDropdownSelect } from '../components/common/CustomDropdownSelect';

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

  const availableDishesCount = dishes.filter(d => d.isAvailableToday).length;
  const unavailableDishesCount = dishes.filter(d => !d.isAvailableToday).length;

  return (
    <div className="container-fluid p-0">
      {/* Page Header */}
      <PageHeader
        icon="bi-book-half"
        title="Catálogo de Platos y Categorías"
        subtitle="Gestión del menú digital: platos, precios, disponibilidad y categorías."
        actions={
          isAdmin && (
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm fw-semibold rounded-3"
                onClick={() => handleOpenCategoryModal()}
              >
                <i className="bi bi-folder-plus me-1" aria-hidden="true"></i> Nueva Categoría
              </button>
              <button
                type="button"
                className="btn-brand btn btn-sm fw-semibold rounded-3"
                onClick={() => handleOpenDishModal()}
              >
                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i> Registrar Plato
              </button>
            </div>
          )
        }
      />

      {/* Row of 3 StatCards */}
      <div className="row g-3 mb-4 stagger-children">
        <div className="col-12 col-sm-4">
          <StatCard
            title="Total Platos"
            value={dishes.length}
            subtitle={`${categories.length} categorías configuradas`}
            icon="bi-egg-fried"
            colorTheme="indigo"
          />
        </div>
        <div className="col-12 col-sm-4">
          <StatCard
            title="Disponibles Hoy"
            value={availableDishesCount}
            subtitle="Listos para despacho en cocina"
            icon="bi-check-circle-fill"
            colorTheme="emerald"
          />
        </div>
        <div className="col-12 col-sm-4">
          <StatCard
            title="No Disponibles"
            value={unavailableDishesCount}
            subtitle="Agotados o pausados hoy"
            icon="bi-x-circle-fill"
            colorTheme="rose"
          />
        </div>
      </div>

      {/* View Toggle: Platos vs Categorías */}
      <div className="btn-group mb-4" role="tablist" aria-label="Cambiar vista del catálogo">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'platos'}
          className={`btn btn-sm fw-semibold rounded-start-3 ${
            activeTab === 'platos' ? 'btn-primary' : 'btn-outline-secondary'
          }`}
          onClick={() => setActiveTab('platos')}
        >
          <i className="bi bi-egg-fried me-2" aria-hidden="true"></i>
          Platos y Carta ({dishes.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'categorias'}
          className={`btn btn-sm fw-semibold rounded-end-3 ${
            activeTab === 'categorias' ? 'btn-primary' : 'btn-outline-secondary'
          }`}
          onClick={() => setActiveTab('categorias')}
        >
          <i className="bi bi-tags-fill me-2" aria-hidden="true"></i>
          Categorías ({categories.length})
        </button>
      </div>

      {activeTab === 'platos' ? (
        <>
          {/* Filters SectionCard */}
          <SectionCard icon="bi-funnel" title="Filtros del Catálogo" className="mb-4">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-5">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Buscar plato por nombre o descripción..."
                />
              </div>
              <div className="col-12 col-sm-6 col-md-3">
                {/* Select de categorización: colores neutros, sin semántica de alerta */}
                <CustomDropdownSelect
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  size="sm"
                  options={[
                    { value: 'todas', label: 'Todas las Categorías', icon: 'bi-grid-3x3-gap-fill', colorVariant: 'secondary' },
                    ...categories.map(cat => ({
                      value: cat.id,
                      label: cat.name,
                      icon: 'bi-tag-fill',
                      colorVariant: 'primary' as const,
                    })),
                  ]}
                />
              </div>
              <div className="col-12 col-sm-6 col-md-4">
                {/* Select de estado: colores semánticos por disponibilidad */}
                <CustomDropdownSelect
                  value={selectedAvailability}
                  onChange={setSelectedAvailability}
                  size="sm"
                  options={[
                    { value: 'todos', label: 'Todos los Estados', icon: 'bi-grid-fill', colorVariant: 'secondary' },
                    { value: 'activos', label: 'Activos en Menú', icon: 'bi-check-circle-fill', colorVariant: 'success' },
                    { value: 'disponibles_hoy', label: 'Disponibles Hoy (Cocina)', icon: 'bi-fire', colorVariant: 'warning' },
                    { value: 'inactivos', label: 'Desactivados del Menú', icon: 'bi-slash-circle-fill', colorVariant: 'danger' },
                  ]}
                />
              </div>
            </div>
          </SectionCard>

          {/* Dish Cards Grid (RF-16) */}
          {filteredDishes.length === 0 ? (
            <EmptyState
              icon="bi-journal-x"
              title="No hay platos que coincidan"
              description="Ajusta los filtros de búsqueda o registra nuevos platos en el catálogo."
              action={
                isAdmin ? (
                  <button
                    type="button"
                    className="btn-brand btn btn-sm fw-semibold rounded-3"
                    onClick={() => handleOpenDishModal()}
                  >
                    Registrar Primer Plato
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="row g-3 mb-4">
              {filteredDishes.map(dish => (
                <div key={dish.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                  <div
                    className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden"
                    style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 0.75rem 1.5rem rgba(0,0,0,0.12)';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = '';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="position-relative" style={{ height: 150, overflow: 'hidden', background: '#f8fafc' }}>
                      <img src={dish.image} alt={dish.name} className="w-100 h-100 object-fit-cover" />
                      <div className="position-absolute top-0 start-0 m-2">
                        <Badge status={dish.categoryName} variant="dark" />
                      </div>
                      <div className="position-absolute top-0 end-0 m-2">
                        <Badge status={dish.active ? 'Activo' : 'Desactivado'} variant={dish.active ? 'success' : 'secondary'} />
                      </div>
                      {!dish.isAvailableToday && (
                        <div className="position-absolute bottom-0 start-0 end-0 bg-danger bg-opacity-90 text-white text-center py-1 small fw-bold text-uppercase">
                          <i className="bi bi-slash-circle-fill me-1" aria-hidden="true"></i>
                          Agotado Hoy
                        </div>
                      )}
                    </div>
                    <div className="card-body d-flex flex-column p-3">
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                        <h3 className="fw-bold mb-0 text-truncate fs-6 text-dark">{dish.name}</h3>
                        <span className="fw-bold flex-shrink-0 text-primary fs-6">S/ {dish.price.toFixed(2)}</span>
                      </div>
                      <p
                        className="mb-3 flex-grow-1 small text-muted"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {dish.description}
                      </p>
                      <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-auto">
                        <div>
                          {dish.isAvailableToday && (
                            <Badge status="Disponible Hoy" variant="info" icon="bi-check-lg" />
                          )}
                        </div>
                        {isAdmin && (
                          <div className="d-flex gap-1">
                            <button
                              type="button"
                              className="btn-icon btn-icon-primary"
                              aria-label={`Editar ${dish.name}`}
                              onClick={() => handleOpenDishModal(dish)}
                            >
                              <i className="bi bi-pencil-fill" aria-hidden="true"></i>
                            </button>
                            <button
                              type="button"
                              className={`btn-icon ${dish.active ? 'btn-icon-danger' : 'btn-icon-success'}`}
                              aria-label={dish.active ? `Desactivar ${dish.name} del menú` : `Activar ${dish.name} en el menú`}
                              onClick={() => toggleDishActive(dish.id)}
                            >
                              <i className={`bi ${dish.active ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} aria-hidden="true"></i>
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
        /* Categories Table */
        <SectionCard icon="bi-tags-fill" title="Categorías del Menú" noPadding>
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
                {categories.map(cat => {
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
                              onClick={() => handleOpenCategoryModal(cat)}
                            >
                              <i className="bi bi-pencil-fill" aria-hidden="true"></i>
                            </button>
                            <button
                              type="button"
                              className="btn-icon btn-icon-danger"
                              aria-label={`Eliminar categoría ${cat.name}`}
                              onClick={() => setDeletingCat(cat)}
                            >
                              <i className="bi bi-trash-fill" aria-hidden="true"></i>
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
        </SectionCard>
      )}

      {/* Dish Modal */}
      <Modal
        isOpen={isDishModalOpen}
        onClose={() => setIsDishModalOpen(false)}
        title={editingDish ? 'Editar Plato del Catálogo' : 'Registrar Nuevo Plato'}
        size="lg"
      >
        <form onSubmit={handleDishSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-8">
              <label htmlFor="dishNameInput" className="form-label">Nombre del Plato *</label>
              <input
                id="dishNameInput"
                type="text"
                className="form-control rounded-3"
                placeholder="Ej. Ceviche Mixto Especial"
                required
                value={dishFormData.name}
                onChange={e => setDishFormData({ ...dishFormData, name: e.target.value })}
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
                  value={dishFormData.price}
                  onChange={e => setDishFormData({ ...dishFormData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label d-block">Categoría *</label>
              <CustomDropdownSelect
                value={dishFormData.categoryId}
                onChange={value => setDishFormData({ ...dishFormData, categoryId: value })}
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
                value={dishFormData.image}
                onChange={e => setDishFormData({ ...dishFormData, image: e.target.value })}
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
              value={dishFormData.description}
              onChange={e => setDishFormData({ ...dishFormData, description: e.target.value })}
            ></textarea>
          </div>
          <div className="d-flex justify-content-end gap-2 pt-3 border-top">
            <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => setIsDishModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-brand btn fw-semibold rounded-3">
              {editingDish ? 'Guardar Cambios' : 'Registrar Plato'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}
      >
        <form onSubmit={handleCategorySubmit}>
          <div className="mb-3">
            <label htmlFor="catNameInput" className="form-label">Nombre de Categoría *</label>
            <input
              id="catNameInput"
              type="text"
              className="form-control rounded-3"
              placeholder="Ej. Sopas y Cremas"
              required
              value={catFormData.name}
              onChange={e => setCatFormData({ ...catFormData, name: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="catDescInput" className="form-label">Descripción</label>
            <input
              id="catDescInput"
              type="text"
              className="form-control rounded-3"
              placeholder="Breve descripción funcional..."
              value={catFormData.description}
              onChange={e => setCatFormData({ ...catFormData, description: e.target.value })}
            />
          </div>
          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => setIsCatModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-brand btn fw-semibold rounded-3">
              {editingCategory ? 'Guardar Categoría' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </Modal>

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
    </div>
  );
};

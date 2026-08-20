import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { Dish } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { DishFilterBar } from './DishFilterBar';
import { DishCard } from './DishCard';
import { DishFormModal, type DishFormData } from './DishFormModal';
import { DishIngredientsModal } from './DishIngredientsModal';
import { DEFAULT_DISH_IMAGE } from './catalogMeta';
import { hasInsufficientStock } from '../inventory/inventoryMeta';

const EMPTY_DISH_FORM: DishFormData = {
  name: '',
  categoryId: '',
  price: 0,
  description: '',
  image: '',
  active: true,
  isAvailableToday: true,
  station: 'plancha',
  prepTimeMinutes: 15,
  allergensText: '',
  recipe: [],
};

/**
 * DishesView — Pestaña "Platos" del Catálogo (RF-11 a RF-16).
 * Dueña de su propio estado (búsqueda, filtros, modal de plato) y lee
 * `useApp()` directamente, igual que `TablesFloorplanView`/`TablesConfigView`
 * en el módulo de Mesas. `CatalogPage` solo decide si esta vista se muestra.
 */
export const DishesView: React.FC = () => {
  const { categories, dishes, insumos, addDish, updateDish, updateDishRecipe, toggleDishActive, currentRole } = useApp();
  const isAdmin = currentRole === 'Administrador';

  // Search & Filter state (RF-14, RF-15)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('todos');
  // Filtro por estación de cocina (KDS) — permite al admin responder
  // "¿qué platos tiene asignados Parrilla?" sin revisar plato por plato.
  const [selectedStation, setSelectedStation] = useState<string>('todas');

  // Dish Modal state (RF-11, RF-12)
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [dishFormData, setDishFormData] = useState<DishFormData>(EMPTY_DISH_FORM);
  const [ingredientsDish, setIngredientsDish] = useState<Dish | null>(null);

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
      const matchesStation = selectedStation === 'todas' || dish.station === selectedStation;
      return matchesSearch && matchesCat && matchesAvail && matchesStation;
    });
  }, [dishes, searchQuery, selectedCategory, selectedAvailability, selectedStation]);

  const handleDishFormChange = (patch: Partial<DishFormData>) => {
    setDishFormData(prev => ({ ...prev, ...patch }));
  };

  // Handle Dish submission
  const handleDishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishFormData.name.trim() || !dishFormData.categoryId) return;

    const allergens = dishFormData.allergensText
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    if (editingDish) {
      updateDish(editingDish.id, {
        name: dishFormData.name,
        categoryId: dishFormData.categoryId,
        price: Number(dishFormData.price),
        description: dishFormData.description,
        image: dishFormData.image || DEFAULT_DISH_IMAGE,
        active: dishFormData.active,
        isAvailableToday: dishFormData.isAvailableToday,
        station: dishFormData.station,
        prepTimeMinutes: Number(dishFormData.prepTimeMinutes),
        allergens: allergens.length > 0 ? allergens : undefined
      });
      // Se persiste siempre en edición (incluso vacía) para permitir
      // limpiar una receta que ya existía.
      updateDishRecipe(editingDish.id, dishFormData.recipe);
    } else {
      const newDishId = addDish({
        name: dishFormData.name,
        categoryId: dishFormData.categoryId,
        price: Number(dishFormData.price),
        description: dishFormData.description,
        image: dishFormData.image || DEFAULT_DISH_IMAGE,
        active: true,
        isAvailableToday: true,
        station: dishFormData.station,
        prepTimeMinutes: Number(dishFormData.prepTimeMinutes),
        allergens: allergens.length > 0 ? allergens : undefined
      });
      if (dishFormData.recipe.length > 0) {
        updateDishRecipe(newDishId, dishFormData.recipe);
      }
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
        isAvailableToday: dish.isAvailableToday,
        station: dish.station,
        prepTimeMinutes: dish.prepTimeMinutes,
        allergensText: dish.allergens?.join(', ') ?? '',
        recipe: dish.recipe ?? []
      });
    } else {
      setEditingDish(null);
      setDishFormData({
        ...EMPTY_DISH_FORM,
        categoryId: categories[0]?.id || '',
        price: 30,
        image: DEFAULT_DISH_IMAGE,
      });
    }
    setIsDishModalOpen(true);
  };

  return (
    <>
      <DishFilterBar
        categories={categories}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedAvailability={selectedAvailability}
        onAvailabilityChange={setSelectedAvailability}
        selectedStation={selectedStation}
        onStationChange={setSelectedStation}
        onCreateDish={isAdmin ? () => handleOpenDishModal() : undefined}
      />

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
        <div className="row g-3 mb-4 catalog-dishes-grid">
          {filteredDishes.map(dish => (
            <div key={dish.id} className="col-12 col-sm-6 col-lg-4 col-xxl-3">
              <DishCard
                dish={dish}
                isAdmin={isAdmin}
                onEdit={handleOpenDishModal}
                onToggleActive={toggleDishActive}
                onViewIngredients={setIngredientsDish}
                insufficientStock={hasInsufficientStock(dish, insumos)}
              />
            </div>
          ))}
        </div>
      )}

      <DishFormModal
        isOpen={isDishModalOpen}
        onClose={() => setIsDishModalOpen(false)}
        onSubmit={handleDishSubmit}
        isEditing={!!editingDish}
        formData={dishFormData}
        onChange={handleDishFormChange}
        categories={categories}
        insumos={insumos}
      />

      <DishIngredientsModal
        dish={ingredientsDish}
        insumos={insumos}
        isOpen={!!ingredientsDish}
        onClose={() => setIngredientsDish(null)}
      />
    </>
  );
};

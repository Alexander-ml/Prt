import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../common/EmptyState';

/** Carta — lectura pública/operativa: muestra platos activos sin controles administrativos. */
export const CatalogMenuView: React.FC = () => {
  const { categories, dishes } = useApp();

  const menuCategories = useMemo(() => categories
    .map(category => ({
      category,
      dishes: dishes.filter(dish => dish.categoryId === category.id && dish.active),
    }))
    .filter(group => group.dishes.length > 0), [categories, dishes]);

  if (menuCategories.length === 0) {
    return (
      <EmptyState
        icon="bi-journal-x"
        title="Aún no hay platos activos para mostrar en la carta"
        description="Activa platos desde el catálogo para que aparezcan agrupados por categoría."
      />
    );
  }

  return (
    <section className="catalog-menu" aria-labelledby="catalogMenuHeading">
      <header className="catalog-menu-header">
        <div>
          <p className="catalog-menu-eyebrow"><i className="bi bi-journal-text" aria-hidden="true"></i> Carta</p>
          <h2 id="catalogMenuHeading">Carta de platos</h2>
          <p>Consulta los platos activos del menú y su disponibilidad actual.</p>
        </div>
      </header>

      <div className="catalog-menu-groups">
        {menuCategories.map(({ category, dishes: categoryDishes }) => (
          <section className="catalog-menu-group" key={category.id} aria-labelledby={`menu-category-${category.id}`}>
            <header>
              <h3 id={`menu-category-${category.id}`}>{category.name}</h3>
              {category.description && <p>{category.description}</p>}
            </header>
            <ul>
              {categoryDishes.map(dish => (
                <li key={dish.id} className={!dish.isAvailableToday ? 'is-unavailable' : ''}>
                  <div className="catalog-menu-dish-copy">
                    <div className="catalog-menu-dish-heading">
                      <h4>{dish.name}</h4>
                      {!dish.isAvailableToday && <span>No disponible hoy</span>}
                    </div>
                    {dish.description && <p>{dish.description}</p>}
                  </div>
                  <strong>S/ {dish.price.toFixed(2)}</strong>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
};

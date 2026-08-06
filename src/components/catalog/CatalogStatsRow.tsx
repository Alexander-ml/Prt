import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';

/**
 * CatalogStatsRow — Fila de 3 StatCards con el resumen del catálogo
 * (Total, Disponibles Hoy, No Disponibles). Lee `useApp()` directamente,
 * igual que el resto de los componentes de `components/catalog/`, para que
 * CatalogPage no tenga que calcular ni pasar estos datos hacia abajo.
 */
export const CatalogStatsRow: React.FC = () => {
  const { categories, dishes } = useApp();

  const availableDishesCount = dishes.filter(d => d.isAvailableToday).length;
  const unavailableDishesCount = dishes.filter(d => !d.isAvailableToday).length;

  return (
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
  );
};
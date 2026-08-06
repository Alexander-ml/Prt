import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { formatMoney } from '../../utils/money';

interface InventoryStatsRowProps {
  /** StatCard ya soporta `onClick` — al hacer clic en "Bajo Stock Mínimo",
   *  InventoryPage cambia a la pestaña Insumos y filtra la tabla a solo
   *  los insumos por debajo de su mínimo. */
  onLowStockClick: () => void;
}

/**
 * InventoryStatsRow — Fila de 4 StatCards con el resumen del inventario
 * (Total Insumos, Valor Total en Stock, Bajo Stock Mínimo, Platos Sin
 * Receta Vinculada). Lee `useApp()` directamente, igual que
 * `CatalogStatsRow`, para que InventoryPage no tenga que calcular ni pasar
 * estos datos hacia abajo. Layout de 4 columnas, mismo patrón que
 * `OrdersStatsRow` (no el de 3 columnas de Catálogo).
 */
export const InventoryStatsRow: React.FC<InventoryStatsRowProps> = ({ onLowStockClick }) => {
  const { insumos, dishes } = useApp();

  const lowStockCount = insumos.filter(i => i.currentStock <= i.minStock).length;
  const totalStockValue = insumos.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);
  const dishesWithoutRecipe = dishes.filter(d => !d.recipe?.length).length;

  return (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 mb-4 stagger-children">
      <div className="col">
        <StatCard
          title="Total Insumos"
          value={insumos.length}
          subtitle="Artículos registrados"
          icon="bi-boxes"
          colorTheme="indigo"
        />
      </div>
      <div className="col">
        <StatCard
          title="Valor Total en Stock"
          value={formatMoney(totalStockValue)}
          subtitle="Capital inmovilizado en insumos"
          icon="bi-cash-stack"
          colorTheme="sky"
        />
      </div>
      <div className="col">
        <StatCard
          title="Bajo Stock Mínimo"
          value={lowStockCount}
          subtitle="Clic para ver solo estos insumos"
          icon="bi-exclamation-triangle-fill"
          colorTheme="rose"
          onClick={onLowStockClick}
        />
      </div>
      <div className="col">
        <StatCard
          title="Platos Sin Receta Vinculada"
          value={dishesWithoutRecipe}
          subtitle="Aún no descuentan stock al venderse"
          icon="bi-egg-fried"
          colorTheme="amber"
        />
      </div>
    </div>
  );
};
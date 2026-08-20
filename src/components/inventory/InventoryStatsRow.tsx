import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { formatMoney } from '../../utils/money';

interface InventoryStatsRowProps {
  onLowStockClick: () => void;
}

export const InventoryStatsRow: React.FC<InventoryStatsRowProps> = ({ onLowStockClick }) => {
  const { insumos, dishes, wasteEntries, inventoryAlerts } = useApp();

  const lowStockCount = insumos.filter(i => i.currentStock <= i.minStock).length;
  const totalStockValue = insumos.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);
  const dishesWithoutRecipe = dishes.filter(d => !d.recipe?.length).length;
  const totalWasteCost = wasteEntries.reduce((sum, w) => sum + w.totalCost, 0);
  const activeAlerts = inventoryAlerts.length;

  return (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 row-cols-xl-6 g-3 mb-4 stagger-children">
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
          title="Platos Sin Receta"
          value={dishesWithoutRecipe}
          subtitle="Aún no descuentan stock al venderse"
          icon="bi-egg-fried"
          colorTheme="amber"
        />
      </div>
      <div className="col">
        <StatCard
          title="Mermas del Mes"
          value={`S/ ${totalWasteCost.toFixed(2)}`}
          subtitle={`${wasteEntries.length} registros`}
          icon="bi-box-seam"
          colorTheme="rose"
        />
      </div>
      <div className="col">
        <StatCard
          title="Alertas Activas"
          value={activeAlerts}
          subtitle="Ver pestaña Alertas"
          icon="bi-bell"
          colorTheme="violet"
        />
      </div>
    </div>
  );
};
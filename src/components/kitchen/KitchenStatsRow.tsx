import React from 'react';
import { StatCard } from '../common/StatCard';

interface KitchenStatsRowProps {
  activeCommandas: number;
  itemsListos: number;
  itemsPendientes: number;
  urgentOrdersCount: number;
}

export const KitchenStatsRow: React.FC<KitchenStatsRowProps> = ({
  activeCommandas,
  itemsListos,
  itemsPendientes,
  urgentOrdersCount,
}) => {
  return (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 mb-4 stagger-children">
      <div className="col">
        <StatCard title="Comandas Activas" value={activeCommandas} icon="bi-receipt" colorTheme="indigo" />
      </div>
      <div className="col">
        <StatCard title="Items Listos" value={itemsListos} icon="bi-check-circle-fill" colorTheme="emerald" />
      </div>
      <div className="col">
        <StatCard title="Items Pendientes" value={itemsPendientes} icon="bi-clock" colorTheme="amber" />
      </div>
      <div className="col">
        <StatCard
          title="Pedidos Urgentes"
          value={urgentOrdersCount}
          icon="bi-alarm-fill"
          colorTheme="rose"
        />
      </div>
    </div>
  );
};
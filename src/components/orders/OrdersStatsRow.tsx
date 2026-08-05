import React from 'react';
import { StatCard } from '../common/StatCard';

interface OrdersStatsRowProps {
  occupiedTables: number;
  activeOrders: number;
  ordersInKitchen: number;
  ordersReady: number;
}

/**
 * OrdersStatsRow — Fila de métricas para Gestión de Pedidos, siguiendo el
 * mismo patrón que KitchenStatsRow (Cocina) y la fila de StatCard de
 * Catálogo: da al mesero/admin una lectura rápida de la operación sin
 * tener que entrar a las pestañas de "Tomar Pedido" o "Historial".
 */
export const OrdersStatsRow: React.FC<OrdersStatsRowProps> = ({
  occupiedTables,
  activeOrders,
  ordersInKitchen,
  ordersReady,
}) => {
  return (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 mb-4 stagger-children">
      <div className="col">
        <StatCard title="Mesas Ocupadas" value={occupiedTables} icon="bi-people-fill" colorTheme="indigo" />
      </div>
      <div className="col">
        <StatCard title="Pedidos Activos" value={activeOrders} icon="bi-receipt" colorTheme="sky" />
      </div>
      <div className="col">
        <StatCard title="En Camino a Listo" value={ordersInKitchen} icon="bi-fire" colorTheme="amber" />
      </div>
      <div className="col">
        <StatCard title="Listos para Cobro" value={ordersReady} icon="bi-check-circle-fill" colorTheme="emerald" />
      </div>
    </div>
  );
};
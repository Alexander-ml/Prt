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
    <>
      <section className="mobile-summary orders-mobile-summary d-sm-none mb-4" aria-label="Resumen operativo de pedidos">
        <div className="mobile-summary-main">
          <p>Pedidos activos</p>
          <strong>{activeOrders}</strong>
        </div>
        <div className="mobile-summary-states orders-mobile-summary-states">
          <span className="is-occupied"><i className="bi bi-people-fill" aria-hidden="true"></i>{occupiedTables} mesas ocupadas</span>
          <span className="is-kitchen"><i className="bi bi-fire" aria-hidden="true"></i>{ordersInKitchen} en camino a listo</span>
          <span className="is-ready"><i className="bi bi-check-circle-fill" aria-hidden="true"></i>{ordersReady} listos para cobro</span>
        </div>
      </section>

      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 mb-4 stagger-children d-none d-sm-flex">
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
    </>
  );
};

import React from 'react';
import type { Dish, Order, OrderItemStatus } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { KitchenOrderItemRow } from './KitchenOrderItemRow';
import { KITCHEN_STATION_META, KITCHEN_STATION_ORDER, getElapsedMinutes, isItemNew } from './kitchenMeta';

interface KitchenStationBoardProps {
  orders: Order[];
  dishes: Dish[];
  onSetItemStatus: (orderId: string, itemId: string, newStatus: OrderItemStatus) => void;
  onRequestCancelItem: (orderId: string, itemId: string, dishName: string) => void;
}

/**
 * KitchenStationBoard — Agrupa los platos pendientes de TODAS las mesas
 * activas por estación de cocina (parrilla, plancha, fríos, postres, bar).
 *
 * Resuelve el problema de que, en una cocina con varios cocineros, cada uno
 * tenga que leer tarjetas completas por mesa para encontrar lo que le
 * corresponde: aquí cada estación ve solo sus propios platos, ordenados por
 * urgencia, sin importar a qué mesa pertenecen.
 */
export const KitchenStationBoard: React.FC<KitchenStationBoardProps> = ({
  orders,
  dishes,
  onSetItemStatus,
  onRequestCancelItem,
}) => {
  const statusRank: Record<string, number> = { pendiente: 0, preparando: 1, listo: 2, entregado: 3 };

  return (
    <div className="kds-station-grid mb-4">
      {KITCHEN_STATION_ORDER.map(station => {
        const meta = KITCHEN_STATION_META[station];

        const rows = orders.flatMap(order =>
          order.items
            .filter(item => item.status !== 'cancelado' && dishes.find(d => d.id === item.dishId)?.station === station)
            .map(item => ({ order, item }))
        );

        rows.sort((a, b) => {
          const rankDiff = (statusRank[a.item.status] ?? 9) - (statusRank[b.item.status] ?? 9);
          if (rankDiff !== 0) return rankDiff;
          const elapsedA = getElapsedMinutes(a.order.sentToKitchenAt) ?? 0;
          const elapsedB = getElapsedMinutes(b.order.sentToKitchenAt) ?? 0;
          return elapsedB - elapsedA;
        });

        const pendingCount = rows.filter(r => r.item.status === 'pendiente' || r.item.status === 'preparando').length;

        return (
          <section key={station} className="kds-station-column" aria-label={`${meta.label}: ${pendingCount} pendientes`}>
              <div className={`kds-station-header kds-station-header-${meta.colorTheme}`}>
                <span className="d-flex align-items-center gap-2">
                  <i className={`bi ${meta.icon}`} aria-hidden="true"></i>
                  {meta.label}
                </span>
                <span className="kds-station-count">{pendingCount}</span>
              </div>
              <div className="kds-station-body">
                {rows.length === 0 ? (
                  <EmptyState icon="bi-check2-circle" title="Sin actividad" description="No hay ítems activos en esta estación." />
                ) : (
                  rows.map(({ order, item }) => (
                    <div key={item.id} className="kds-station-item-wrap">
                      <div className="kds-station-item-table">
                        <i className="bi bi-geo-alt-fill me-1" aria-hidden="true"></i>
                        Mesa #{order.tableNumber}
                        <span className="mx-1">•</span>
                        {order.waiterName}
                      </div>
                      <KitchenOrderItemRow
                        item={item}
                        dish={dishes.find(d => d.id === item.dishId)}
                        isNew={isItemNew(item, order)}
                        onSetStatus={newStatus => onSetItemStatus(order.id, item.id, newStatus)}
                        onRequestCancel={() => onRequestCancelItem(order.id, item.id, item.dishName)}
                      />
                    </div>
                  ))
                )}
              </div>
          </section>
        );
      })}
    </div>
  );
};

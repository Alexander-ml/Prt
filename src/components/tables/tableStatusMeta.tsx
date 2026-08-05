import type { TableStatus } from '../../types';

export interface TableStatusMeta {
  label: string;
  icon: string;
  colorVariant: 'success' | 'warning' | 'danger' | 'info';
}

/**
 * TABLE_STATUS_META — Fuente única de verdad para la presentación de cada
 * estado de mesa (label, icono, color semántico). Se reutiliza en:
 *  - TableCard          (pill de estado sobre el plano)
 *  - TablesFloorplanView (filtro de Estado, modal de unir mesas)
 *  - TablesConfigView    (badge de Estado en el listado admin de mesas)
 *
 * Los colores coinciden 1:1 con las clases `.table-card.status-*` definidas
 * en custom.css, para que el plano de sala y cualquier otro listado que use
 * este mapa se vean siempre coherentes entre sí.
 */
export const TABLE_STATUS_META: Record<TableStatus, TableStatusMeta> = {
  disponible: { label: 'Disponible', icon: 'bi-check-circle-fill', colorVariant: 'success' },
  ocupada: { label: 'Ocupada', icon: 'bi-people-fill', colorVariant: 'danger' },
  reservada: { label: 'Reservada', icon: 'bi-bookmark-star-fill', colorVariant: 'warning' },
  limpieza: { label: 'En Limpieza', icon: 'bi-droplet-fill', colorVariant: 'info' },
};
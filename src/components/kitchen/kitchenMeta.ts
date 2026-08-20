import type { Dish, KitchenStation, Order, OrderItem, OrderItemStatus, ServiceType } from '../../types';

/**
 * kitchenMeta — Metadatos y helpers puros del Kitchen Display System.
 *
 * Se extraen a un módulo aparte (sin JSX) para que KitchenPage y todos los
 * componentes de components/kitchen/ compartan exactamente la misma lógica
 * de tiempos/urgencia, y para que sea sencillo testear estas funciones de
 * forma aislada más adelante.
 */

export const KITCHEN_STATION_META: Record<
  KitchenStation,
  { label: string; icon: string; colorTheme: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' }
> = {
  frios:    { label: 'Fríos / Entradas', icon: 'bi-snow2',       colorTheme: 'sky' },
  plancha:  { label: 'Plancha',          icon: 'bi-egg-fried',   colorTheme: 'amber' },
  parrilla: { label: 'Parrilla',         icon: 'bi-fire',        colorTheme: 'rose' },
  postres:  { label: 'Postres',          icon: 'bi-cake2-fill',  colorTheme: 'violet' },
  bebidas:  { label: 'Bar / Bebidas',    icon: 'bi-cup-straw',   colorTheme: 'emerald' },
};

export const KITCHEN_STATION_ORDER: KitchenStation[] = ['frios', 'plancha', 'parrilla', 'postres', 'bebidas'];

export const SERVICE_TYPE_META: Record<ServiceType, { label: string; icon: string }> = {
  mesa:         { label: 'Mesa', icon: 'bi-cup-hot-fill' },
  para_llevar:  { label: 'Para Llevar', icon: 'bi-bag-fill' },
  delivery:     { label: 'Delivery', icon: 'bi-bicycle' },
};

/** Metadatos de estado de ítem compartidos por el tablero de cocina. */
export const KDS_ITEM_STATUS_META: Record<
  OrderItemStatus,
  { label: string; icon: string; tone: 'neutral' | 'warning' | 'success' | 'danger' }
> = {
  pendiente:   { label: 'Pendiente',   icon: 'bi-hourglass-split', tone: 'neutral' },
  preparando:  { label: 'Preparando',  icon: 'bi-fire',            tone: 'warning' },
  listo:       { label: 'Listo',       icon: 'bi-check-circle',   tone: 'success' },
  entregado:   { label: 'Entregado',   icon: 'bi-box-seam',       tone: 'success' },
  cancelado:   { label: 'Cancelado',   icon: 'bi-slash-circle',   tone: 'danger' },
};

/** Estado visual de urgencia de un ticket u ítem, relativo a su tiempo esperado. */
export type TimeStatus = 'ok' | 'warning' | 'urgent' | 'unknown';

/**
 * Convierte un string "HH:mm" (o similar parseable por Date) anclado al día
 * de hoy en un objeto Date real. Devuelve null si no se puede interpretar.
 */
export function parseTimeToday(value: string | undefined): Date | null {
  if (!value) return null;
  const today = new Date();
  const parsed = new Date(`${today.toDateString()} ${value}`);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** Minutos transcurridos desde un string "HH:mm" hasta ahora (nunca negativo). */
export function getElapsedMinutes(value: string | undefined): number | null {
  const parsed = parseTimeToday(value);
  if (!parsed) return null;
  const diff = Math.floor((Date.now() - parsed.getTime()) / 60000);
  return diff < 0 ? 0 : diff;
}

/**
 * Tiempo esperado de preparación de una comanda: el máximo entre los
 * `prepTimeMinutes` de sus platos activos (no cancelados). Reemplaza el
 * umbral fijo de "20 minutos para cualquier plato" por uno realista según lo
 * que efectivamente se pidió.
 */
export function getExpectedMinutes(order: Order, dishes: Dish[]): number {
  const activeItems = order.items.filter(i => i.status !== 'cancelado');
  if (activeItems.length === 0) return 15;
  const times = activeItems.map(i => dishes.find(d => d.id === i.dishId)?.prepTimeMinutes ?? 15);
  return Math.max(...times);
}

/** Clasifica el tiempo transcurrido de un ticket contra su tiempo esperado. */
export function getTimeStatus(elapsedMinutes: number | null, expectedMinutes: number): TimeStatus {
  if (elapsedMinutes === null) return 'unknown';
  const ratio = expectedMinutes > 0 ? elapsedMinutes / expectedMinutes : 1;
  if (ratio >= 1) return 'urgent';
  if (ratio >= 0.7) return 'warning';
  return 'ok';
}

/**
 * Señal exclusivamente visual para destacar la llegada inmediata de una
 * comanda. No interviene en sus estados ni en las alertas sonoras existentes.
 */
export function isRecentlySentToKitchen(order: Order): boolean {
  const elapsedMinutes = getElapsedMinutes(order.sentToKitchenAt);
  return elapsedMinutes !== null && elapsedMinutes <= 2;
}

/**
 * Orden de trabajo del tablero: urgencia temporal primero, prioridad manual
 * después, comandas normales por antigüedad y, al final, las listas. Mantiene
 * separados los conceptos de urgencia automática y prioridad manual.
 */
export function getKdsQueueRank(order: Order, dishes: Dish[]): number {
  if (order.status === 'listo') return 3;
  const timeStatus = getTimeStatus(getElapsedMinutes(order.sentToKitchenAt), getExpectedMinutes(order, dishes));
  if (timeStatus === 'urgent') return 0;
  if (order.priority) return 1;
  return 2;
}

/**
 * Un ítem se considera "nuevo" cuando se agregó después de que la comanda
 * ya había sido comisionada a cocina (p.ej. el mesero sumó un postre a mitad
 * de servicio). Se usa para resaltarlo y evitar que pase desapercibido entre
 * ítems que ya están listos.
 */
export function isItemNew(item: OrderItem, order: Order): boolean {
  const sentAt = parseTimeToday(order.sentToKitchenAt);
  const addedAt = parseTimeToday(item.addedAt);
  if (!sentAt || !addedAt) return false;
  // Margen de 30s para evitar falsos positivos por redondeo de reloj.
  return addedAt.getTime() > sentAt.getTime() + 30000;
}

export const TIME_STATUS_LABEL: Record<TimeStatus, string> = {
  ok: 'En tiempo',
  warning: 'Por vencer',
  urgent: 'Urgente',
  unknown: 'Sin datos',
};

import type { Dish, Insumo } from '../../types';
import type { DropdownOption } from '../common/CustomDropdownSelect';

/**
 * inventoryMeta — Metadatos y helpers puros del módulo Inventario e Insumos
 * (sin JSX), siguiendo el mismo patrón que components/kitchen/kitchenMeta.ts,
 * components/tables/tableStatusMeta.tsx y components/config/configMeta.ts.
 *
 * Antes, el nivel de stock (crítico/bajo/óptimo) se calculaba con un
 * ternario repetido inline dentro del `.map()` de la tabla de InventoryPage.
 * `getStockLevel()` es ahora la única fuente de verdad — un umbral que
 * cambie (ej. "crítico" de 50% a 40%) se edita en un solo lugar.
 */

export type StockLevel = 'critico' | 'bajo' | 'optimo';

export interface StockLevelMeta {
  label: string;
  colorVariant: 'success' | 'warning' | 'danger';
  /** Coincide 1:1 con las clases `.stock-progress-fill.*` de custom.css. */
  fillClass: 'ok' | 'low' | 'critical';
  /** Color de texto para el porcentaje junto a la barra de stock. */
  textColor: string;
}

export const STOCK_LEVEL_META: Record<StockLevel, StockLevelMeta> = {
  optimo: { label: 'Óptimo', colorVariant: 'success', fillClass: 'ok', textColor: '#059669' },
  bajo: { label: 'Bajo', colorVariant: 'warning', fillClass: 'low', textColor: '#d97706' },
  critico: { label: 'Crítico', colorVariant: 'danger', fillClass: 'critical', textColor: '#e11d48' },
};

/**
 * Porcentaje de stock respecto al "óptimo" (el doble del mínimo de
 * seguridad), acotado a 100. Mismo cálculo que ya usaba InventoryPage.tsx,
 * solo que ahora vive en un único lugar.
 */
export function getStockPercentage(insumo: Insumo): number {
  const ratio = insumo.minStock > 0 ? insumo.currentStock / (insumo.minStock * 2) : 1;
  return Math.min(100, Math.round(ratio * 100));
}

/** Único punto que decide el nivel de stock — reemplaza el ternario inline de InventoryPage. */
export function getStockLevel(insumo: Insumo): StockLevel {
  const pct = getStockPercentage(insumo);
  if (pct < 50) return 'critico';
  if (pct < 80) return 'bajo';
  return 'optimo';
}

/**
 * ¿Algún insumo de la receta del plato tiene menos stock disponible del
 * que la receta necesita para servir una sola unidad? Es un indicador de
 * SOLO VISIBILIDAD para Catálogo (badge en DishCard) — a propósito no
 * apaga `isAvailableToday`, esa es una decisión de negocio pendiente (ver
 * diagnóstico de Inventario, sección 8). Un plato sin receta configurada
 * nunca se marca como insuficiente (retrocompatible).
 */
export function hasInsufficientStock(dish: Pick<Dish, 'recipe'>, insumos: Insumo[]): boolean {
  if (!dish.recipe?.length) return false;
  return dish.recipe.some(line => {
    const insumo = insumos.find(i => i.id === line.insumoId);
    return !insumo || insumo.currentStock < line.quantityPerServing;
  });
}

/** Opciones de Unidad de Medida — InsumoFormModal (CustomDropdownSelect). */
export const UNIT_OPTIONS: DropdownOption[] = [
  { value: 'Kg', label: 'Kilogramos (Kg)', icon: 'bi-rulers' },
  { value: 'Lt', label: 'Litros (Lt)', icon: 'bi-rulers' },
  { value: 'Unidades', label: 'Unidades', icon: 'bi-rulers' },
  { value: 'Botella', label: 'Botellas', icon: 'bi-rulers' },
  { value: 'Cajas', label: 'Cajas', icon: 'bi-rulers' },
];
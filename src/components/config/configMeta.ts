import type { Promotion } from '../../types';
import type { DropdownOption } from '../common/CustomDropdownSelect';

/**
 * configMeta — Metadatos y constantes puras del módulo Configuración
 * General del Sistema, sin JSX. Se extraen a un módulo aparte para que
 * `PromotionsView`, `PromotionTable` y `PromotionFormModal` compartan
 * exactamente los mismos valores, siguiendo el mismo patrón que
 * components/kitchen/kitchenMeta.ts, components/tables/tableStatusMeta.tsx
 * y components/users/userRoleMeta.ts.
 *
 * Antes, el "alcance" de una promoción vivía duplicado a mano en 2 lugares
 * de ConfigPage.tsx (las <option> del <select> del formulario, con un cast
 * `as any` en el onChange, y un ternario manual en la columna "Alcance" de
 * la tabla). PROMOTION_TYPE_META es ahora la única fuente de verdad: un
 * alcance nuevo (ej. "Por Cliente Frecuente") es una sola entrada nueva
 * aquí — TypeScript exige cubrir todos los valores de `Promotion['type']`
 * vía `Record<...>`, así que un alcance no declarado simplemente no compila.
 */
export interface PromotionTypeMeta {
  label: string;
  icon: string;
  /** true = requiere elegir Categoría o Plato específico como target. */
  needsTarget: boolean;
}

export const PROMOTION_TYPE_META: Record<Promotion['type'], PromotionTypeMeta> = {
  total: { label: 'Cuenta Total de Mesa', icon: 'bi-receipt', needsTarget: false },
  category: { label: 'Por Categoría de Platos', icon: 'bi-tags-fill', needsTarget: true },
  dish: { label: 'Por Plato Específico', icon: 'bi-egg-fried', needsTarget: true },
};

export const PROMOTION_TYPE_ORDER: Promotion['type'][] = ['total', 'category', 'dish'];

/** Options del select "Alcance del Descuento" en PromotionFormModal (CustomDropdownSelect). */
export const PROMOTION_TYPE_OPTIONS: DropdownOption[] = PROMOTION_TYPE_ORDER.map(type => ({
  value: type,
  label: PROMOTION_TYPE_META[type].label,
  icon: PROMOTION_TYPE_META[type].icon,
}));
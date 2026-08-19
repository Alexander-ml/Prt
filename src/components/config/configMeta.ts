import type { Promotion, RestaurantOpeningDay, Weekday } from '../../types';
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

export const WEEKDAY_META: { day: Weekday; label: string }[] = [
  { day: 'lunes', label: 'Lunes' },
  { day: 'martes', label: 'Martes' },
  { day: 'miercoles', label: 'Miércoles' },
  { day: 'jueves', label: 'Jueves' },
  { day: 'viernes', label: 'Viernes' },
  { day: 'sabado', label: 'Sábado' },
  { day: 'domingo', label: 'Domingo' },
];

const DEFAULT_OPENING_SCHEDULE: RestaurantOpeningDay[] = [
  { day: 'lunes', isOpen: false, opensAt: '12:00', closesAt: '22:00' },
  { day: 'martes', isOpen: true, opensAt: '12:00', closesAt: '22:00' },
  { day: 'miercoles', isOpen: true, opensAt: '12:00', closesAt: '22:00' },
  { day: 'jueves', isOpen: true, opensAt: '12:00', closesAt: '22:00' },
  { day: 'viernes', isOpen: true, opensAt: '12:00', closesAt: '23:00' },
  { day: 'sabado', isOpen: true, opensAt: '12:00', closesAt: '23:00' },
  { day: 'domingo', isOpen: true, opensAt: '12:00', closesAt: '22:00' },
];

/** Completa con valores seguros los datos antiguos que solo tenían texto libre. */
export const normalizeOpeningSchedule = (schedule?: RestaurantOpeningDay[]): RestaurantOpeningDay[] => {
  const configuredDays = new Map(schedule?.map(item => [item.day, item]));

  return DEFAULT_OPENING_SCHEDULE.map(defaultDay => ({
    ...(configuredDays.get(defaultDay.day) ?? defaultDay),
  }));
};

/** Resumen legible que se conserva para recibos u otras vistas que aún usan texto. */
export const formatOpeningHours = (schedule: RestaurantOpeningDay[]): string =>
  schedule
    .map(item => {
      const label = WEEKDAY_META.find(day => day.day === item.day)?.label ?? item.day;
      return item.isOpen ? `${label}: ${item.opensAt}–${item.closesAt}` : `${label}: cerrado`;
    })
    .join(' · ');

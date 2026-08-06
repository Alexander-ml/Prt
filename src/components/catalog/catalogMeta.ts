import type { DropdownOption } from '../common/CustomDropdownSelect';

/**
 * catalogMeta — Metadatos y constantes puras del módulo Catálogo (Platos y
 * Categorías), sin JSX. Se extraen a un módulo aparte para que DishesView,
 * DishFormModal y DishFilterBar compartan exactamente los mismos valores,
 * siguiendo el mismo patrón que components/kitchen/kitchenMeta.ts y
 * components/tables/tableStatusMeta.tsx.
 */

/**
 * Imagen de referencia usada cuando un plato se registra o edita sin URL
 * propia. Antes vivía repetida como literal en dos lugares distintos de
 * CatalogPage.tsx (alta y edición) — una sola fuente de verdad aquí evita
 * que un cambio futuro de imagen por defecto tenga que hacerse dos veces.
 */
export const DEFAULT_DISH_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

/**
 * Opciones del filtro de disponibilidad en DishFilterBar (RF-14, RF-15).
 * 'todos' es el valor por defecto (sin filtrar).
 */
export const AVAILABILITY_FILTER_OPTIONS: DropdownOption[] = [
  { value: 'todos', label: 'Todos los Estados', icon: 'bi-grid-fill', colorVariant: 'secondary' },
  { value: 'activos', label: 'Activos en Menú', icon: 'bi-check-circle-fill', colorVariant: 'success' },
  { value: 'disponibles_hoy', label: 'Disponibles Hoy (Cocina)', icon: 'bi-fire', colorVariant: 'warning' },
  { value: 'inactivos', label: 'Desactivados del Menú', icon: 'bi-slash-circle-fill', colorVariant: 'danger' },
];
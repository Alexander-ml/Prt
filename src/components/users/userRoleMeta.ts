import type { UserRole } from '../../types';
import type { DropdownOption } from '../common/CustomDropdownSelect';

/**
 * userRoleMeta — Metadatos puros del módulo Personal y Usuarios, sin JSX.
 *
 * Antes vivía repetido a mano en 4 lugares distintos de UsersPage.tsx (color
 * de avatar, variante del Badge, options del filtro de rol y options del
 * formulario de alta/edición), con datos ligeramente distintos cada vez y
 * sin ningún caso por defecto declarado explícitamente para un rol nuevo.
 *
 * ROLE_META es ahora la única fuente de verdad: agregar un rol (ej.
 * "Cajero") es una sola entrada nueva aquí, y automáticamente se ve
 * correcto en el avatar, el Badge, el filtro y el formulario — mismo
 * patrón que KITCHEN_STATION_META (components/kitchen/kitchenMeta.ts) y
 * TABLE_STATUS_META (components/tables/tableStatusMeta.tsx).
 */
export interface RoleMeta {
  label: string;
  description: string;
  icon: string;
  /** Variante para el componente Badge (columna "Rol Asignado" de la tabla). */
  badgeVariant: 'primary' | 'success' | 'warning';
  /** Fondo del círculo de iniciales en la tabla. */
  avatarBg: string;
  /** Color de las iniciales/ícono sobre `avatarBg`. */
  avatarColor: string;
  /** Variante de color para CustomDropdownSelect (filtro y formulario). */
  dropdownColorVariant: string;
}

export const ROLE_META: Record<UserRole, RoleMeta> = {
  Administrador: {
    label: 'Administrador',
    description: 'Acceso total al sistema y configuración',
    icon: 'bi-shield-fill',
    badgeVariant: 'primary',
    avatarBg: 'var(--color-brand-light)',
    avatarColor: 'var(--color-brand)',
    dropdownColorVariant: 'violet',
  },
  Mesero: {
    label: 'Mesero',
    description: 'Atención en sala, toma de pedidos y cobro',
    icon: 'bi-person-fill',
    badgeVariant: 'success',
    avatarBg: 'var(--color-emerald-bg)',
    avatarColor: 'var(--color-emerald)',
    dropdownColorVariant: 'primary',
  },
  Cocina: {
    label: 'Cocina',
    description: 'Kitchen Display System y preparación de platos',
    icon: 'bi-fire',
    badgeVariant: 'warning',
    avatarBg: 'var(--color-amber-bg)',
    avatarColor: 'var(--color-amber)',
    dropdownColorVariant: 'warning',
  },
};

export const ROLE_ORDER: UserRole[] = ['Administrador', 'Mesero', 'Cocina'];

/**
 * Estilo (fondo + color) del círculo de iniciales de un usuario según su
 * rol. Separado de `UserTable` para que la tabla solo se ocupe del layout
 * de la fila (tamaño, tipografía, disposición) y no del "cómo se ve un rol".
 */
export function getAvatarStyle(role: UserRole): { background: string; color: string } {
  const meta = ROLE_META[role];
  return { background: meta.avatarBg, color: meta.avatarColor };
}

/** Options de rol para el filtro de la tabla, con "Todos los Roles" agregado aparte. */
export const ROLE_FILTER_OPTIONS: DropdownOption[] = [
  { value: 'todos', label: 'Todos los Roles', icon: 'bi-people-fill', colorVariant: 'secondary' },
  ...ROLE_ORDER.map(role => ({
    value: role,
    label: ROLE_META[role].label,
    icon: ROLE_META[role].icon,
    colorVariant: ROLE_META[role].dropdownColorVariant,
  })),
];

/** Options de rol para el formulario de alta/edición, con descripción de cada rol. */
export const ROLE_FORM_OPTIONS: DropdownOption[] = ROLE_ORDER.map(role => ({
  value: role,
  label: ROLE_META[role].label,
  description: ROLE_META[role].description,
  icon: ROLE_META[role].icon,
  colorVariant: ROLE_META[role].dropdownColorVariant,
}));
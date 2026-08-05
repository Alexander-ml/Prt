import type { PaymentMethod, PaymentMethodType, PaymentMethodMeta } from '../types';

/**
 * payments.ts — Catálogo único de formas de pago.
 *
 * Antes solo existían 3 opciones (efectivo/tarjeta/mixto), lo cual no
 * refleja cómo cobra un restaurante real. Aquí se definen los métodos
 * concretos que el cajero puede elegir (RF-59 ampliado) y a qué
 * categoría general pertenece cada uno — la categoría sigue existiendo
 * para no romper reportes/filtros que agrupan por "efectivo / tarjeta /
 * mixto", pero ahora se deriva automáticamente del método específico
 * en vez de ser una tercera opción manual.
 */
export const PAYMENT_METHODS: PaymentMethodMeta[] = [
  { id: 'efectivo', label: 'Efectivo', icon: 'bi-cash-coin', category: 'efectivo' },
  { id: 'visa', label: 'Visa', icon: 'bi-credit-card-2-front-fill', category: 'tarjeta' },
  { id: 'mastercard', label: 'Mastercard', icon: 'bi-credit-card-2-back-fill', category: 'tarjeta' },
  { id: 'amex', label: 'American Express', icon: 'bi-credit-card-fill', category: 'tarjeta' },
  { id: 'yape', label: 'Yape', icon: 'bi-phone-fill', category: 'billetera' },
  { id: 'plin', label: 'Plin', icon: 'bi-phone-vibrate-fill', category: 'billetera' },
  { id: 'transferencia', label: 'Transferencia', icon: 'bi-bank2', category: 'transferencia' },
  { id: 'vale_consumo', label: 'Vale de Consumo', icon: 'bi-ticket-perforated-fill', category: 'otro' },
  { id: 'credito_interno', label: 'Crédito Interno', icon: 'bi-journal-bookmark-fill', category: 'otro' },
];

export const getPaymentMethodMeta = (id: PaymentMethodType): PaymentMethodMeta =>
  PAYMENT_METHODS.find(m => m.id === id) ?? PAYMENT_METHODS[0];

/** Categoría general de una lista de métodos (para el campo Sale.paymentMethod). */
export const resolvePaymentCategory = (methods: PaymentMethodType[]): PaymentMethod => {
  const distinctCategories = new Set(methods.map(m => getPaymentMethodMeta(m).category));
  if (distinctCategories.size > 1) return 'mixto';
  const only = methods[0];
  return only ? getPaymentMethodMeta(only).category : 'efectivo';
};

export const CATEGORY_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  billetera: 'Billetera Digital',
  transferencia: 'Transferencia',
  otro: 'Otro',
  mixto: 'Mixto',
};

export const CATEGORY_COLOR_VARIANTS: Record<PaymentMethod, string> = {
  efectivo: 'success',
  tarjeta: 'primary',
  billetera: 'violet',
  transferencia: 'sky',
  otro: 'amber',
  mixto: 'secondary',
};

/**
 * Variante para el componente `Badge`, que tiene una paleta más acotada
 * (success/danger/warning/info/primary/secondary/dark) que la de
 * `CustomDropdownSelect` — de ahí que no reutilice CATEGORY_COLOR_VARIANTS
 * directamente (ese tiene 'violet'/'sky'/'amber', que Badge no soporta).
 */
export const CATEGORY_BADGE_VARIANTS: Record<PaymentMethod, 'success' | 'primary' | 'info' | 'secondary' | 'warning' | 'dark'> = {
  efectivo: 'success',
  tarjeta: 'primary',
  billetera: 'info',
  transferencia: 'secondary',
  otro: 'warning',
  mixto: 'dark',
};
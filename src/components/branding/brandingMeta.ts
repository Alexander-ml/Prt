/** Límites para la identidad visual del prototipo. */
export const ACCEPTED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

export const getRestaurantInitial = (name: string): string =>
  name.trim().charAt(0).toLocaleUpperCase('es-PE') || 'R';

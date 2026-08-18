import type { TipoComprobante } from '../../../types';
import { round2 } from '../../../utils/money';

/**
 * salesModalsShared — lo que de verdad comparten 2+ modales de
 * components/sales/modals/. Antes vivía al inicio de SalesModals.tsx
 * (1042 líneas, 8 modales sin relación de dominio entre sí); acá queda
 * solo lo estrictamente compartido, siguiendo el mismo criterio que
 * components/catalog/catalogMeta.ts y components/config/configMeta.ts.
 */

/** Etiqueta legible de cada tipo de comprobante — la usan ConfirmCheckoutModal,
 *  ReopenSaleModal y ReceiptModal. */
export const COMPROBANTE_LABELS: Record<TipoComprobante, string> = {
  ticket: 'Ticket',
  boleta: 'Boleta',
  factura: 'Factura',
};

/** Ajusta el último monto de la lista para que la suma cuadre exacto con
 *  target (evita céntimos perdidos por redondeo). La usa SplitBillModal
 *  tanto en modo "equitativo" como "por_platos". */
export const distributeRemainder = (amounts: number[], target: number): number[] => {
  if (amounts.length === 0) return amounts;
  const sum = round2(amounts.reduce((a, b) => a + b, 0));
  const diff = round2(target - sum);
  const adjusted = [...amounts];
  adjusted[adjusted.length - 1] = round2(adjusted[adjusted.length - 1] + diff);
  return adjusted;
};

import type { TipoComprobante } from '../types';

/**
 * comprobante.ts — Regla de negocio de cuándo un comprobante exige datos de
 * cliente, centralizada en un solo lugar.
 *
 * Antes, `comprobanteTipo === 'factura'` estaba repetido de forma idéntica
 * en pages/SalesPage.tsx, components/sales/BillingView.tsx y
 * components/sales/billing/CheckoutPanel.tsx, y ninguno de los tres
 * consideraba el monto de la venta. Por norma SUNAT, una Boleta también
 * exige registrar DNI (u otro documento) y nombre completo del comprador a
 * partir de S/ 700 — regla que hoy no existía en el sistema.
 */

/** Umbral (S/) a partir del cual una Boleta exige registrar los datos del
 *  comprador, por norma SUNAT vigente. */
export const BOLETA_CLIENTE_OBLIGATORIO_DESDE = 700;

export interface ComprobanteRequirements {
  /** true si el comprobante necesita un cliente seleccionado (Factura
   *  siempre; Boleta solo si el total alcanza el umbral). */
  requiereCliente: boolean;
  /** true si el cliente seleccionado debe tener RUC (solo Factura). */
  requiereRUC: boolean;
}

export function evaluarRequisitosComprobante(comprobanteTipo: TipoComprobante, total: number): ComprobanteRequirements {
  const requiereCliente = comprobanteTipo === 'factura' || (comprobanteTipo === 'boleta' && total >= BOLETA_CLIENTE_OBLIGATORIO_DESDE);
  const requiereRUC = comprobanteTipo === 'factura';
  return { requiereCliente, requiereRUC };
}

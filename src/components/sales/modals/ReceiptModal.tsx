import React from 'react';
import type { Sale } from '../../../types';
import { Modal } from '../../common/Modal';
import { Badge } from '../../common/Badge';
import { formatMoney } from '../../../utils/money';
import { getPaymentMethodMeta } from '../../../utils/payments';
import { COMPROBANTE_LABELS } from './salesModalsShared';

/* ─────────────────────────────────────────────────────────────
   ReceiptModal — Vista e impresión de comprobante de venta
   (RF-61, punto #18 del análisis UX). Incluye serie/correlativo,
   cliente, cajero, desglose real de pago, vuelto y estado.
   ───────────────────────────────────────────────────────────── */
interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
  onPrint: () => void;
  restaurantName: string;
  restaurantRuc: string;
  restaurantAddress: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose, onPrint, restaurantName, restaurantRuc, restaurantAddress }) => {
  if (!sale) return null;

  const estadoBadge = sale.isCancelled
    ? { text: 'ANULADA', variant: 'danger' as const }
    : sale.estadoPago === 'facturada'
    ? { text: 'FACTURADA', variant: 'primary' as const }
    : { text: 'PAGADA', variant: 'success' as const };

  return (
    <Modal isOpen={!!sale} onClose={onClose} title={`Comprobante ${sale.serie}-${String(sale.correlativo).padStart(4, '0')}`} size="sm">
      <div className="p-3 rounded-3 receipt-paper">
        <div className="text-center mb-1">
          <div className="fw-bold receipt-restaurant-name">{restaurantName}</div>
          <div className="text-muted">RUC {restaurantRuc}</div>
          <div className="text-muted">{restaurantAddress}</div>
        </div>
        <hr className="my-2" />
        <div className="text-center mb-1">
          <div className="fw-bold receipt-comprobante-type">{COMPROBANTE_LABELS[sale.comprobanteTipo].toUpperCase()} ELECTRÓNIC{sale.comprobanteTipo === 'boleta' ? 'A' : 'O'}</div>
          <div>{sale.serie}-{String(sale.correlativo).padStart(4, '0')}</div>
        </div>
        <hr className="my-2" />
        <div className="d-flex justify-content-between"><span>Mesa:</span><span>#{sale.tableNumber}</span></div>
        <div className="d-flex justify-content-between"><span>Fecha:</span><span>{sale.closedAt}</span></div>
        <div className="d-flex justify-content-between"><span>Mesero:</span><span>{sale.waiterName}</span></div>
        <div className="d-flex justify-content-between"><span>Cajero:</span><span>{sale.cashierName}</span></div>
        {sale.cliente && (
          <>
            <hr className="my-2" />
            <div className="d-flex justify-content-between"><span>{sale.cliente.tipoDocumento}:</span><span>{sale.cliente.numeroDocumento}</span></div>
            <div className="text-truncate">{sale.cliente.nombreORazonSocial}</div>
            {sale.cliente.direccion && <div className="text-truncate text-muted">{sale.cliente.direccion}</div>}
          </>
        )}
        <hr className="my-2" />
        <div className="d-flex flex-column gap-1 text-start mb-2">
          {sale.items.map((it, idx) => (
            <div key={idx} className="d-flex justify-content-between">
              <span>{it.quantity}x {it.dishName}</span>
              <span>S/ {(it.price * it.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <hr className="my-2" />
        <div className="d-flex justify-content-between"><span>Subtotal:</span><span>{formatMoney(sale.subtotal)}</span></div>
        {sale.discountAmount > 0 && (
          <div className="d-flex justify-content-between"><span>{sale.discountLabel ?? 'Descuento'}:</span><span>-{formatMoney(sale.discountAmount)}</span></div>
        )}
        <div className="d-flex justify-content-between"><span>IGV ({sale.igvPercent}%):</span><span>{formatMoney(sale.taxAmount)}</span></div>
        {sale.tipAmount > 0 && (
          <div className="d-flex justify-content-between"><span>Propina:</span><span>{formatMoney(sale.tipAmount)}</span></div>
        )}
        {sale.roundingAdjustment !== 0 && (
          <div className="d-flex justify-content-between"><span>Redondeo:</span><span>{formatMoney(sale.roundingAdjustment)}</span></div>
        )}
        <div className="d-flex justify-content-between fw-bold receipt-total-row">
          <span>TOTAL:</span><span>{formatMoney(sale.total)}</span>
        </div>
        <hr className="my-2" />
        <div className="text-start mb-1">
          {sale.paymentBreakdown.map(p => (
            <div key={p.id} className="d-flex justify-content-between">
              <span>{getPaymentMethodMeta(p.method).label}:</span><span>{formatMoney(p.amount)}</span>
            </div>
          ))}
          {sale.cashDetail && (
            <>
              <div className="d-flex justify-content-between"><span>Recibido:</span><span>{formatMoney(sale.cashDetail.amountReceived)}</span></div>
              <div className="d-flex justify-content-between"><span>Vuelto:</span><span>{formatMoney(sale.cashDetail.changeGiven)}</span></div>
            </>
          )}
        </div>
        <hr className="my-2" />
        <div className="d-flex justify-content-center mb-1">
          <Badge status={estadoBadge.text} variant={estadoBadge.variant} />
        </div>
        {sale.isCancelled && sale.cancellationReason && (
          <div className="text-center receipt-cancel-reason">Motivo: {sale.cancellationReason}</div>
        )}
        {sale.editedAt && (
          <div className="text-center receipt-footnote">
            Corregida el {sale.editedAt}{sale.editReason ? ` · ${sale.editReason}` : ''}
          </div>
        )}
        {/* Antes decía "Válido como comprobante ante SUNAT" con un ícono de QR
            decorativo — el sistema todavía no genera XML firmado, no lo envía
            a SUNAT/OSE y no recibe una Constancia de Recepción (CDR), así que
            esa frase afirmaba una validez tributaria que hoy nadie puede
            verificar. Este comprobante es un documento interno del sistema. */}
        <div className="text-center mt-2 receipt-footnote">
          <i className="bi bi-info-circle me-1"></i>Comprobante interno — pendiente de integración con SUNAT
        </div>
        <div className="text-center receipt-thanks">¡Gracias por su preferencia!</div>
      </div>
      <div className="d-flex justify-content-end gap-2 mt-3 pt-2 modal-footer-divider">
        <button type="button" className="btn btn-outline-secondary rounded-3" onClick={onClose}>
          Cerrar
        </button>
        <button type="button" className="btn-brand btn fw-semibold rounded-3" onClick={onPrint}>
          <i className="bi bi-printer me-1"></i> Imprimir
        </button>
      </div>
    </Modal>
  );
};

import React from 'react';
import type {
  Order,
  Promotion,
  Cliente,
  TipoComprobante,
  PaymentMethodType,
  PaymentSplitEntry,
} from '../../../types';
import { SectionCard } from '../../common/SectionCard';
import { CustomDropdownSelect } from '../../common/CustomDropdownSelect';
import { formatMoney } from '../../../utils/money';
import { evaluarRequisitosComprobante, BOLETA_CLIENTE_OBLIGATORIO_DESDE } from '../../../utils/comprobante';
import { PaymentMethodPicker } from './PaymentMethodPicker';

const COMPROBANTE_OPTIONS: { id: TipoComprobante; icon: string; label: string; hint: string }[] = [
  { id: 'ticket', icon: 'bi-receipt', label: 'Ticket', hint: 'Sin datos de cliente' },
  { id: 'boleta', icon: 'bi-file-earmark-text-fill', label: 'Boleta', hint: 'DNI opcional' },
  { id: 'factura', icon: 'bi-file-earmark-ruled-fill', label: 'Factura', hint: 'RUC obligatorio' },
];

interface CheckoutPanelProps {
  currentOrder: Order | undefined;

  // Totales
  subtotal: number;
  activePromo: Promotion | undefined;
  discountAmount: number;
  igvPercent: number;
  taxAmount: number;
  tipAmountInput: string;
  setTipAmountInput: (val: string) => void;
  roundingAdjustment: number;
  totalAmount: number;

  // Comprobante y cliente (RF-61)
  comprobanteTipo: TipoComprobante;
  setComprobanteTipo: (val: TipoComprobante) => void;
  clientes: Cliente[];
  selectedClienteId: string;
  setSelectedClienteId: (val: string) => void;
  onOpenClienteModal: () => void;

  // Forma de pago (RF-59 ampliado)
  paymentBreakdown: PaymentSplitEntry[];
  pendingBalance: number;
  onAddPaymentLine: (method: PaymentMethodType) => void;
  onUpdatePaymentLineAmount: (id: string, amountInput: string) => void;
  onRemovePaymentLine: (id: string) => void;
  cashReceivedInput: string;
  setCashReceivedInput: (val: string) => void;
  changeGiven: number;

  // Confirmar cobro
  canConfirm: boolean;
  onOpenConfirmCheckout: () => void;
}

/**
 * CheckoutPanel — "Cliente, Pago y Cierre" (pasos 3-4 del flujo de cobro).
 *
 * Antes "Comprobante y Cliente" y "Detalle de Cobro" competían visualmente
 * con la misma jerarquía que la lista de platos. Aquí el TOTAL y el saldo
 * PENDIENTE quedan como el elemento más grande de toda la pantalla (punto
 * #5), y BillingView monta este panel dentro de un contenedor `sticky-lg-top`
 * para que se mantenga visible mientras el cajero hace scroll en pedidos
 * largos (punto #6) — el botón "Confirmar Cierre de Venta" es siempre lo
 * último que se ve, protagonista de la pantalla (punto #7).
 */
export const CheckoutPanel: React.FC<CheckoutPanelProps> = ({
  currentOrder,
  subtotal,
  activePromo,
  discountAmount,
  igvPercent,
  taxAmount,
  tipAmountInput,
  setTipAmountInput,
  roundingAdjustment,
  totalAmount,
  comprobanteTipo,
  setComprobanteTipo,
  clientes,
  selectedClienteId,
  setSelectedClienteId,
  onOpenClienteModal,
  paymentBreakdown,
  pendingBalance,
  onAddPaymentLine,
  onUpdatePaymentLineAmount,
  onRemovePaymentLine,
  cashReceivedInput,
  setCashReceivedInput,
  changeGiven,
  canConfirm,
  onOpenConfirmCheckout,
}) => {
  // Misma regla centralizada que SalesPage.tsx y BillingView.tsx: Factura
  // siempre exige cliente con RUC; Boleta lo exige desde S/ 700 (regla
  // SUNAT que antes no existía en el sistema — solo se pedía para Factura).
  const { requiereCliente: requiresCliente, requiereRUC } = evaluarRequisitosComprobante(comprobanteTipo, totalAmount);
  const selectedCliente = clientes.find(c => c.id === selectedClienteId);
  const clienteWarning = requiresCliente && (!selectedCliente || (requiereRUC && selectedCliente.tipoDocumento !== 'RUC'));
  const paymentStarted = paymentBreakdown.length > 0;
  const paymentComplete = paymentStarted && Math.abs(pendingBalance) < 0.01;

  return (
    <div className="d-flex flex-column gap-4">
      <SectionCard icon="bi-file-earmark-text" title="2. Comprobante y Cliente">
        <div className="mb-3">
          <label className="form-label fw-bold d-block">Tipo de Comprobante</label>
          <div className="d-flex gap-2">
            {COMPROBANTE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={comprobanteTipo === opt.id}
                className={`btn flex-fill fw-semibold ${comprobanteTipo === opt.id ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                style={{ borderRadius: 8, minHeight: 56, fontSize: '0.8rem', padding: '0.5rem 0.25rem' }}
                onClick={() => setComprobanteTipo(opt.id)}
              >
                <i className={`bi ${opt.icon} d-block mb-1`} style={{ fontSize: '1.1rem' }}></i>
                {opt.label}
              </button>
            ))}
          </div>
          <small className="d-block mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {COMPROBANTE_OPTIONS.find(o => o.id === comprobanteTipo)?.hint}
          </small>
        </div>

        {comprobanteTipo !== 'ticket' && (
          <div>
            <label id="clienteSelectLabel" className="form-label fw-bold d-block">
              Cliente {requiresCliente && <span className="text-danger">*</span>}
            </label>
            <div className="d-flex gap-2">
              <div className="flex-grow-1">
                <CustomDropdownSelect
                  id="clienteSelect"
                  labelId="clienteSelectLabel"
                  value={selectedClienteId}
                  onChange={setSelectedClienteId}
                  placeholder="Consumidor Final"
                  options={[
                    { value: '', label: 'Consumidor Final', icon: 'bi-person', colorVariant: 'secondary' },
                    ...clientes.map(c => ({
                      value: c.id,
                      label: c.nombreORazonSocial,
                      description: `${c.tipoDocumento} ${c.numeroDocumento}`,
                      icon: c.tipoDocumento === 'RUC' ? 'bi-building' : 'bi-person-fill',
                      colorVariant: 'primary',
                    })),
                  ]}
                />
              </div>
              <button
                type="button"
                className="btn btn-outline-primary flex-shrink-0"
                style={{ borderRadius: 8, minHeight: 38 }}
                onClick={onOpenClienteModal}
                aria-label="Registrar nuevo cliente"
              >
                <i className="bi bi-person-plus-fill"></i>
              </button>
            </div>
            {clienteWarning && (
              <small className="d-block mt-1 text-danger" style={{ fontSize: '0.75rem' }}>
                {requiereRUC
                  ? 'Una factura requiere un cliente con RUC.'
                  : `Una boleta desde S/ ${BOLETA_CLIENTE_OBLIGATORIO_DESDE} requiere registrar los datos del cliente.`}
              </small>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard icon="bi-wallet2" title="3. Pago y Cierre">
        {/* Desglose de totales — compacto, el TOTAL es lo único que domina */}
        <div className="d-flex flex-column gap-2 mb-3">
          <div className="d-flex justify-content-between" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <span>Subtotal consumo:</span>
            <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{formatMoney(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="d-flex justify-content-between" style={{ fontSize: '0.875rem', color: '#059669' }}>
              <span><i className="bi bi-tag-fill me-1"></i>Descuento ({activePromo?.discountPercentage}%):</span>
              <span className="fw-bold">− {formatMoney(discountAmount)}</span>
            </div>
          )}
          <div className="d-flex justify-content-between" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <span>IGV ({igvPercent}%):</span>
            <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{formatMoney(taxAmount)}</span>
          </div>

          <div className="d-flex align-items-center justify-content-between gap-2" style={{ fontSize: '0.875rem' }}>
            <label htmlFor="tipInput" className="mb-0" style={{ color: 'var(--text-muted)' }}>
              <i className="bi bi-heart-fill me-1" style={{ color: '#cd6d9e' }}></i>Propina (opcional):
            </label>
            <div className="input-group" style={{ maxWidth: 120 }}>
              <span className="input-group-text py-1 px-2" style={{ fontSize: '0.8rem' }}>S/</span>
              <input
                id="tipInput"
                type="number"
                min={0}
                step="0.10"
                className="form-control form-control-sm text-end"
                placeholder="0.00"
                value={tipAmountInput}
                onChange={e => setTipAmountInput(e.target.value)}
              />
            </div>
          </div>

          {roundingAdjustment !== 0 && (
            <div className="d-flex justify-content-between" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Redondeo (S/ 0.10 más cercano):</span>
              <span className="fw-semibold">{formatMoney(roundingAdjustment)}</span>
            </div>
          )}
        </div>

        {/* Bloque protagonista: TOTAL + PENDIENTE siempre visibles (punto #5 y #6) */}
        <div
          className="rounded-3 p-3 mb-3"
          style={{ background: 'var(--color-brand-light)', border: '1px solid var(--color-brand-subtle)' }}
        >
          <div className="d-flex align-items-baseline justify-content-between flex-wrap gap-2">
            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>TOTAL A COBRAR</span>
            <span style={{ fontSize: 'clamp(1.6rem, 7vw, 2rem)', fontWeight: 900, color: 'var(--color-brand)', letterSpacing: '-0.03em' }}>
              {formatMoney(totalAmount)}
            </span>
          </div>
          <div
            className="d-flex align-items-center justify-content-between mt-2 pt-2"
            style={{ borderTop: '1px dashed var(--color-brand-subtle)' }}
          >
            <span className="fw-semibold" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pendiente</span>
            <span
              className="fw-bold"
              style={{
                fontSize: '1.1rem',
                color: paymentComplete ? 'var(--color-emerald-text)' : 'var(--text-primary)',
              }}
            >
              {paymentComplete ? (
                <><i className="bi bi-check-circle-fill me-1"></i>Cubierto</>
              ) : (
                formatMoney(Math.max(0, pendingBalance))
              )}
            </span>
          </div>
        </div>

        <PaymentMethodPicker
          disabled={!currentOrder}
          paymentBreakdown={paymentBreakdown}
          pendingBalance={pendingBalance}
          onAddPaymentLine={onAddPaymentLine}
          onUpdatePaymentLineAmount={onUpdatePaymentLineAmount}
          onRemovePaymentLine={onRemovePaymentLine}
          cashReceivedInput={cashReceivedInput}
          setCashReceivedInput={setCashReceivedInput}
          changeGiven={changeGiven}
        />

        {/* Confirm RF-60 — el botón protagonista de la pantalla */}
        <button
          type="button"
          className="btn w-100 fw-bold mt-3"
          style={{
            background: canConfirm ? 'linear-gradient(135deg, #059669, #10b981)' : '#e2e8f0',
            color: canConfirm ? '#fff' : '#94a3b8',
            borderRadius: 10, padding: '0.75rem', minHeight: 52,
            fontSize: '1rem', border: 'none',
            boxShadow: canConfirm ? '0 4px 12px rgba(5,150,105,0.3)' : 'none',
            transition: 'box-shadow 0.15s ease',
          }}
          disabled={!canConfirm}
          onClick={onOpenConfirmCheckout}
        >
          <i className="bi bi-check-circle-fill me-2"></i>
          Confirmar Cierre de Venta
        </button>
        {!currentOrder ? (
          <small className="d-block text-center mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Seleccione una mesa para habilitar el cobro.
          </small>
        ) : !canConfirm && (
          <small className="d-block text-center mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Complete la forma de pago{clienteWarning ? ' y los datos del cliente' : ''} para habilitar el cobro.
          </small>
        )}
      </SectionCard>
    </div>
  );
};

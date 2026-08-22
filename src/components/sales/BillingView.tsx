import React from 'react';
import type {
  Order,
  Promotion,
  Cliente,
  CashSession,
  TipoComprobante,
  PaymentMethodType,
  PaymentSplitEntry,
  SplitMode,
  GuestBillSplit,
} from '../../types';
import { CashSessionBar } from './CashSessionBar';
import { BillingSteps } from './billing/BillingSteps';
import type { BillingStepDef } from './billing/BillingSteps';
import { OrderSummaryCard } from './billing/OrderSummaryCard';
import { CheckoutPanel } from './billing/CheckoutPanel';
import { evaluarRequisitosComprobante } from '../../utils/comprobante';

interface BillingViewProps {
  // Caja (RF-56 v2) — gate: sin turno abierto no se puede cobrar.
  cashSession: CashSession | null;
  onOpenCashSession: () => void;
  onCloseCashSession: () => void;
  onCashMovement: () => void;

  // Mesa a liquidar
  orders: Order[];
  selectedOrderId: string;
  setSelectedOrderId: (val: string) => void;
  currentOrder: Order | undefined;
  subtotal: number;

  // Promoción
  promotions: Promotion[];
  selectedPromoId: string;
  setSelectedPromoId: (val: string) => void;
  activePromo: Promotion | undefined;
  discountAmount: number;

  // Totales
  igvPercent: number;
  taxAmount: number;
  tipAmountInput: string;
  setTipAmountInput: (val: string) => void;
  tipAmount: number;
  roundingAdjustment: number;
  totalAmount: number;

  // División de cuenta (RF-58 ampliado)
  splitMode: SplitMode | undefined;
  splitBills: GuestBillSplit[];
  onOpenSplitModal: () => void;
  onClearSplit: () => void;

  // Comprobante y cliente (RF-61)
  comprobanteTipo: TipoComprobante;
  setComprobanteTipo: (val: TipoComprobante) => void;
  clientes: Cliente[];
  selectedClienteId: string;
  setSelectedClienteId: (val: string) => void;
  onOpenClienteModal: () => void;

  // Forma de pago (RF-59 ampliado) — 1 o varias líneas de pago
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
 * BillingView — Tab "Cobro" de SalesPage (rearmado v3 — reorganización UX).
 *
 * La lógica y el contrato de props son exactamente los mismos que en la
 * versión anterior (SalesPage no necesitó ningún cambio); lo que cambió es
 * cómo se organiza visualmente el mismo flujo real de un cobro de
 * restaurante: (0) turno de caja abierto, (1) mesa y pedido, (2) comprobante
 * y cliente, (3) forma de pago, (4) confirmar.
 *
 * Este componente ahora es solo un orquestador: compone
 * `BillingSteps` (narrativa de progreso), `OrderSummaryCard` (columna
 * izquierda: mesa + pedido + promoción/split colapsados) y `CheckoutPanel`
 * (columna derecha, fijada con `sticky-lg-top` para que el total y el botón
 * de cobro sigan visibles al hacer scroll). Cada pieza vive en
 * `src/components/sales/billing/` para que se pueda editar por separado sin
 * tocar un archivo de 550+ líneas.
 */
export const BillingView: React.FC<BillingViewProps> = ({
  cashSession,
  onOpenCashSession,
  onCloseCashSession,
  onCashMovement,
  orders,
  selectedOrderId,
  setSelectedOrderId,
  currentOrder,
  subtotal,
  promotions,
  selectedPromoId,
  setSelectedPromoId,
  activePromo,
  discountAmount,
  igvPercent,
  taxAmount,
  tipAmountInput,
  setTipAmountInput,
  roundingAdjustment,
  totalAmount,
  splitMode,
  splitBills,
  onOpenSplitModal,
  onClearSplit,
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
  const isCashOpen = !!cashSession && cashSession.status === 'abierta';

  // Estado de cada paso del flujo — se deriva de las mismas props que ya
  // recibía este componente. requiresCliente ahora usa la misma regla
  // centralizada que SalesPage.tsx (Factura siempre, Boleta desde S/ 700)
  // en vez de repetir `comprobanteTipo === 'factura'` a mano.
  const { requiereCliente: requiresCliente, requiereRUC } = evaluarRequisitosComprobante(comprobanteTipo, totalAmount);
  const selectedCliente = clientes.find(c => c.id === selectedClienteId);
  const clienteOk = !requiresCliente || (!!selectedCliente && (!requiereRUC || selectedCliente.tipoDocumento === 'RUC'));
  const paymentComplete = paymentBreakdown.length > 0 && Math.abs(pendingBalance) < 0.01;

  const steps: BillingStepDef[] = [
    { label: 'Mesa', icon: 'bi-table', status: currentOrder ? 'done' : 'active' },
    { label: 'Cliente', icon: 'bi-file-earmark-text', status: !currentOrder ? 'pending' : clienteOk ? 'done' : 'active' },
    { label: 'Pago', icon: 'bi-wallet2', status: !currentOrder || !clienteOk ? 'pending' : paymentComplete ? 'done' : 'active' },
    { label: 'Cobrar', icon: 'bi-check-circle', status: canConfirm ? 'active' : 'pending' },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      {/* Estado de Caja — compuerta: sin turno abierto no se puede cobrar */}
      <CashSessionBar
        cashSession={cashSession}
        variant="gate"
        onOpenClick={onOpenCashSession}
        onCloseClick={onCloseCashSession}
        onMovementClick={onCashMovement}
      />

      <BillingSteps steps={steps} />

      <fieldset disabled={!isCashOpen} className="border-0 p-0 m-0">
        <div className="row g-4">
          {/* Left: Mesa y Pedido */}
          <div className="col-12 col-lg-7">
            <OrderSummaryCard
              orders={orders}
              selectedOrderId={selectedOrderId}
              setSelectedOrderId={setSelectedOrderId}
              currentOrder={currentOrder}
              promotions={promotions}
              selectedPromoId={selectedPromoId}
              setSelectedPromoId={setSelectedPromoId}
              activePromo={activePromo}
              splitMode={splitMode}
              splitBills={splitBills}
              onOpenSplitModal={onOpenSplitModal}
              onClearSplit={onClearSplit}
            />
          </div>

          {/* Right: Comprobante, Cliente, Pago — fijo al hacer scroll (punto #6) */}
          <div className="col-12 col-lg-5">
            <div className="sticky-lg-top billing-checkout-sticky">
              <CheckoutPanel
                currentOrder={currentOrder}
                subtotal={subtotal}
                activePromo={activePromo}
                discountAmount={discountAmount}
                igvPercent={igvPercent}
                taxAmount={taxAmount}
                tipAmountInput={tipAmountInput}
                setTipAmountInput={setTipAmountInput}
                roundingAdjustment={roundingAdjustment}
                totalAmount={totalAmount}
                comprobanteTipo={comprobanteTipo}
                setComprobanteTipo={setComprobanteTipo}
                clientes={clientes}
                selectedClienteId={selectedClienteId}
                setSelectedClienteId={setSelectedClienteId}
                onOpenClienteModal={onOpenClienteModal}
                paymentBreakdown={paymentBreakdown}
                pendingBalance={pendingBalance}
                onAddPaymentLine={onAddPaymentLine}
                onUpdatePaymentLineAmount={onUpdatePaymentLineAmount}
                onRemovePaymentLine={onRemovePaymentLine}
                cashReceivedInput={cashReceivedInput}
                setCashReceivedInput={setCashReceivedInput}
                changeGiven={changeGiven}
                canConfirm={canConfirm}
                onOpenConfirmCheckout={onOpenConfirmCheckout}
              />
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
};

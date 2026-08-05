import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type {
  PaymentMethodType,
  PaymentSplitEntry,
  CashPaymentDetail,
  TipoComprobante,
  SplitMode,
  GuestBillSplit,
  Sale,
  ProcessSaleBillingParams,
  UpdateSalePaymentParams,
} from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { PageHeader } from '../components/common/PageHeader';
import { BillingView } from '../components/sales/BillingView';
import { HistoryView } from '../components/sales/HistoryView';
import {
  SplitBillModal,
  ClienteModal,
  OpenCashSessionModal,
  CloseCashSessionModal,
  CashMovementModal,
  ConfirmCheckoutModal,
  ReopenSaleModal,
  ReceiptModal,
} from '../components/sales/SalesModals';
import { round2, roundToNearestDime, sumMoney } from '../utils/money';

export const SalesPage: React.FC = () => {
  const {
    users,
    orders,
    sales,
    promotions,
    taxes,
    clientes,
    addCliente,
    restaurantInfo,
    processSaleBilling,
    cancelSale,
    updateSalePayment,
    cashSession,
    cashSessionHistory,
    openCashSession,
    closeCashSession,
    registerManualCashMovement,
    currentRole,
  } = useApp();

  const location = useLocation();
  const isAdmin = currentRole === 'Administrador';
  const currentUserName = users.find(u => u.role === currentRole && u.active)?.name ?? currentRole;

  const [activeTab, setActiveTab] = useState<'billing' | 'history'>('billing');

  // Mesa a liquidar
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // Comprobante y cliente (RF-61)
  const [comprobanteTipo, setComprobanteTipo] = useState<TipoComprobante>('ticket');
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);

  // Promoción y propina
  const [selectedPromoId, setSelectedPromoId] = useState<string>('');
  const [tipAmountInput, setTipAmountInput] = useState<string>('');

  // División de cuenta (RF-58 ampliado)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode | undefined>(undefined);
  const [splitBills, setSplitBills] = useState<GuestBillSplit[]>([]);

  // Forma de pago (RF-59 ampliado)
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentSplitEntry[]>([]);
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');

  // Confirmación previa al cobro y comprobante resultante
  const [isConfirmCheckoutOpen, setIsConfirmCheckoutOpen] = useState(false);
  const [viewReceiptSale, setViewReceiptSale] = useState<Sale | null>(null);

  // Anulación y corrección de ventas (Admin)
  const [cancelSaleObj, setCancelSaleObj] = useState<Sale | null>(null);
  const [reopenSaleObj, setReopenSaleObj] = useState<Sale | null>(null);

  // Caja (RF-56 v2)
  const [isOpenCashModalOpen, setIsOpenCashModalOpen] = useState(false);
  const [isCloseCashModalOpen, setIsCloseCashModalOpen] = useState(false);
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);

  // Filtros del historial (RF-63) — filtrado en cliente sobre datos ya cargados.
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');

  useEffect(() => {
    if (location.state?.billTableId) {
      const order = orders.find(o => o.tableId === location.state.billTableId && o.status !== 'cerrado');
      if (order) {
        setSelectedOrderId(order.id);
        setActiveTab('billing');
      }
    } else if (orders.length > 0 && !selectedOrderId) {
      const open = orders.find(o => o.status !== 'cerrado');
      if (open) setSelectedOrderId(open.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, orders]);

  // Cambiar de mesa invalida cualquier desglose de pago en progreso: los
  // montos ya tecleados corresponden al total de la mesa anterior.
  useEffect(() => {
    setPaymentBreakdown([]);
    setCashReceivedInput('');
    setSplitMode(undefined);
    setSplitBills([]);
  }, [selectedOrderId]);

  const currentOrder = orders.find(o => o.id === selectedOrderId);
  const subtotal = currentOrder
    ? round2(currentOrder.items.reduce((sum, i) => sum + i.price * i.quantity, 0))
    : 0;

  const activePromo = promotions.find(p => p.id === selectedPromoId && p.active);
  const discountAmount = activePromo ? round2((subtotal * activePromo.discountPercentage) / 100) : 0;
  const activeIgv = taxes.find(t => t.active && t.name.includes('IGV'));
  const igvPercent = activeIgv ? activeIgv.percentage : 18;
  const taxAmount = round2(((subtotal - discountAmount) * igvPercent) / 100);
  const tipAmount = round2(parseFloat(tipAmountInput) || 0);
  // Mismo redondeo comercial que aplica AppContext.processSaleBilling — se
  // replica aquí solo para la vista previa, el monto real siempre lo calcula
  // el contexto al procesar el cobro.
  const { rounded: totalAmount, adjustment: roundingAdjustment } = roundToNearestDime(
    subtotal - discountAmount + taxAmount + tipAmount
  );

  const paidSoFar = sumMoney(paymentBreakdown.map(p => p.amount));
  const pendingBalance = round2(totalAmount - paidSoFar);
  const cashLine = paymentBreakdown.find(p => p.method === 'efectivo');
  const cashReceived = parseFloat(cashReceivedInput) || 0;
  const changeGiven = cashLine ? round2(Math.max(0, cashReceived - cashLine.amount)) : 0;

  const requiresCliente = comprobanteTipo === 'factura';
  const selectedClienteObj = clientes.find(c => c.id === selectedClienteId);
  const clienteOk = !requiresCliente || (!!selectedClienteObj && selectedClienteObj.tipoDocumento === 'RUC');
  const isCashSessionOpen = !!cashSession && cashSession.status === 'abierta';
  const paymentComplete = paymentBreakdown.length > 0 && Math.abs(pendingBalance) < 0.01;
  const cashOk = !cashLine || cashReceived >= cashLine.amount - 0.001;
  const canConfirm = !!currentOrder && isCashSessionOpen && paymentComplete && clienteOk && cashOk;

  // --- Forma de pago ---
  const handleAddPaymentLine = (method: PaymentMethodType) => {
    if (paymentBreakdown.some(p => p.method === method)) return;
    const amount = Math.max(0, round2(pendingBalance));
    setPaymentBreakdown(prev => [...prev, { id: `pg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, method, amount }]);
  };

  const handleUpdatePaymentLineAmount = (id: string, amountInput: string) => {
    const amount = Math.max(0, round2(parseFloat(amountInput) || 0));
    setPaymentBreakdown(prev => prev.map(p => (p.id === id ? { ...p, amount } : p)));
  };

  const handleRemovePaymentLine = (id: string) => {
    const removed = paymentBreakdown.find(p => p.id === id);
    setPaymentBreakdown(prev => prev.filter(p => p.id !== id));
    if (removed?.method === 'efectivo') setCashReceivedInput('');
  };

  // --- División de cuenta ---
  const handleConfirmSplit = (mode: SplitMode, splits: GuestBillSplit[]) => {
    setSplitMode(mode);
    setSplitBills(splits);
  };

  const handleClearSplit = () => {
    setSplitMode(undefined);
    setSplitBills([]);
  };

  // --- Cliente ---
  const handleSaveCliente = (data: Omit<import('../types').Cliente, 'id'>) => {
    const nuevo = addCliente(data);
    setSelectedClienteId(nuevo.id);
  };

  // --- Cobro final ---
  const handleFinalConfirm = () => {
    if (!currentOrder || !canConfirm) return;
    const cashDetail: CashPaymentDetail | undefined = cashLine
      ? { amountReceived: cashReceived, changeGiven }
      : undefined;
    const params: ProcessSaleBillingParams = {
      orderId: currentOrder.id,
      comprobanteTipo,
      cliente: comprobanteTipo === 'ticket' ? undefined : selectedClienteObj,
      appliedPromoId: selectedPromoId || undefined,
      tipAmount,
      paymentBreakdown,
      cashDetail,
      splitMode,
      splitBills: splitMode ? splitBills : undefined,
    };
    const newSale = processSaleBilling(params);
    setViewReceiptSale(newSale);

    // Transacción cerrada: limpiar el formulario para la siguiente mesa.
    setSelectedOrderId('');
    setComprobanteTipo('ticket');
    setSelectedClienteId('');
    setSelectedPromoId('');
    setTipAmountInput('');
    setPaymentBreakdown([]);
    setCashReceivedInput('');
    setSplitMode(undefined);
    setSplitBills([]);
  };

  // --- Caja ---
  const handleConfirmOpenCash = (initialAmount: number) => openCashSession(initialAmount, currentUserName);
  const handleConfirmCloseCash = (countedCash: number) => closeCashSession(countedCash, currentUserName);
  const handleConfirmCashMovement = (type: 'ingreso_manual' | 'retiro_manual', amount: number, description: string) =>
    registerManualCashMovement(type, amount, description);

  // --- Corrección de venta (Admin) ---
  const handleConfirmReopen = (saleId: string, params: UpdateSalePaymentParams) => updateSalePayment(saleId, params);

  // History & stats
  const filteredSales = sales.filter(s => {
    const matchesDate = !filterDate || s.closedAt.includes(filterDate);
    const matchesPayment = !filterPaymentMethod || s.paymentMethod === filterPaymentMethod;
    const matchesStatus =
      !filterStatus ||
      (filterStatus === 'cerrada' && !s.isCancelled) ||
      (filterStatus === 'anulada' && s.isCancelled);
    const q = filterSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.id.toLowerCase().includes(q) ||
      `${s.serie}-${s.correlativo}`.toLowerCase().includes(q) ||
      s.waiterName.toLowerCase().includes(q) ||
      String(s.tableNumber).includes(q);
    return matchesDate && matchesPayment && matchesStatus && matchesSearch;
  });
  const validSales = sales.filter(s => !s.isCancelled);
  const totalSalesSum = validSales.reduce((acc, s) => acc + s.total, 0);
  const averageTicket = validSales.length > 0 ? totalSalesSum / validSales.length : 0;

  const dishSalesMap: Record<string, number> = {};
  validSales.forEach(s => {
    s.items.forEach(i => {
      dishSalesMap[i.dishName] = (dishSalesMap[i.dishName] || 0) + i.quantity;
    });
  });
  const topDishes = Object.entries(dishSalesMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const handleClearFilters = () => {
    setFilterDate('');
    setFilterPaymentMethod('');
    setFilterStatus('');
    setFilterSearch('');
  };

  const clienteLabelForConfirm = comprobanteTipo !== 'ticket' && selectedClienteObj
    ? `${selectedClienteObj.tipoDocumento} ${selectedClienteObj.numeroDocumento} — ${selectedClienteObj.nombreORazonSocial}`
    : undefined;

  return (
    <div className="container-fluid p-0">
      <PageHeader
        icon="bi-cash-coin"
        title="Ventas, Cobro y Facturación"
        subtitle="Caja, resumen de cuenta, comprobante, división de pago y reportes de ventas."
        actions={
          <div className="d-flex w-100 gap-2" role="tablist" aria-label="Cambiar vista de ventas">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'billing'}
              className={`btn fw-semibold flex-fill d-flex align-items-center justify-content-center gap-1 ${
                activeTab === 'billing' ? 'btn-primary' : 'btn-outline-primary'
              }`}
              style={{ minHeight: 44, borderRadius: 8, fontSize: 'clamp(0.78rem, 3.2vw, 0.9rem)' }}
              onClick={() => setActiveTab('billing')}
            >
              <i className="bi bi-credit-card" aria-hidden="true"></i>
              <span>Cobro</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              className={`btn fw-semibold flex-fill d-flex align-items-center justify-content-center gap-1 ${
                activeTab === 'history' ? 'btn-primary' : 'btn-outline-primary'
              }`}
              style={{ minHeight: 44, borderRadius: 8, fontSize: 'clamp(0.78rem, 3.2vw, 0.9rem)' }}
              onClick={() => setActiveTab('history')}
            >
              <i className="bi bi-graph-up" aria-hidden="true"></i>
              <span>Historial</span>
            </button>
          </div>
        }
      />

      {activeTab === 'billing' ? (
        <BillingView
          cashSession={cashSession}
          onOpenCashSession={() => setIsOpenCashModalOpen(true)}
          onCloseCashSession={() => setIsCloseCashModalOpen(true)}
          onCashMovement={() => setIsCashMovementModalOpen(true)}
          orders={orders}
          selectedOrderId={selectedOrderId}
          setSelectedOrderId={setSelectedOrderId}
          currentOrder={currentOrder}
          subtotal={subtotal}
          promotions={promotions}
          selectedPromoId={selectedPromoId}
          setSelectedPromoId={setSelectedPromoId}
          activePromo={activePromo}
          discountAmount={discountAmount}
          igvPercent={igvPercent}
          taxAmount={taxAmount}
          tipAmountInput={tipAmountInput}
          setTipAmountInput={setTipAmountInput}
          tipAmount={tipAmount}
          roundingAdjustment={roundingAdjustment}
          totalAmount={totalAmount}
          splitMode={splitMode}
          splitBills={splitBills}
          onOpenSplitModal={() => setIsSplitModalOpen(true)}
          onClearSplit={handleClearSplit}
          comprobanteTipo={comprobanteTipo}
          setComprobanteTipo={setComprobanteTipo}
          clientes={clientes}
          selectedClienteId={selectedClienteId}
          setSelectedClienteId={setSelectedClienteId}
          onOpenClienteModal={() => setIsClienteModalOpen(true)}
          paymentBreakdown={paymentBreakdown}
          pendingBalance={pendingBalance}
          onAddPaymentLine={handleAddPaymentLine}
          onUpdatePaymentLineAmount={handleUpdatePaymentLineAmount}
          onRemovePaymentLine={handleRemovePaymentLine}
          cashReceivedInput={cashReceivedInput}
          setCashReceivedInput={setCashReceivedInput}
          changeGiven={changeGiven}
          canConfirm={canConfirm}
          onOpenConfirmCheckout={() => setIsConfirmCheckoutOpen(true)}
        />
      ) : (
        <HistoryView
          isAdmin={isAdmin}
          cashSession={cashSession}
          onOpenCashSession={() => setIsOpenCashModalOpen(true)}
          onCloseCashSession={() => setIsCloseCashModalOpen(true)}
          onCashMovement={() => setIsCashMovementModalOpen(true)}
          cashSessionHistory={cashSessionHistory}
          validSalesCount={validSales.length}
          totalSalesSum={totalSalesSum}
          averageTicket={averageTicket}
          cancelledCount={sales.filter(s => s.isCancelled).length}
          topDishes={topDishes}
          filteredSales={filteredSales}
          filterDate={filterDate}
          setFilterDate={setFilterDate}
          filterPaymentMethod={filterPaymentMethod}
          setFilterPaymentMethod={setFilterPaymentMethod}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterSearch={filterSearch}
          setFilterSearch={setFilterSearch}
          onClearFilters={handleClearFilters}
          onOpenReceipt={setViewReceiptSale}
          onOpenReopen={setReopenSaleObj}
          onOpenCancel={setCancelSaleObj}
        />
      )}

      <SplitBillModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        order={currentOrder}
        subtotal={subtotal}
        discountAmount={discountAmount}
        taxAmount={taxAmount}
        tipAmount={tipAmount}
        roundingAdjustment={roundingAdjustment}
        totalAmount={totalAmount}
        onConfirm={handleConfirmSplit}
      />

      <ClienteModal
        isOpen={isClienteModalOpen}
        onClose={() => setIsClienteModalOpen(false)}
        defaultTipoDocumento={comprobanteTipo === 'factura' ? 'RUC' : 'DNI'}
        onSave={handleSaveCliente}
      />

      <OpenCashSessionModal
        isOpen={isOpenCashModalOpen}
        onClose={() => setIsOpenCashModalOpen(false)}
        openedByLabel={currentUserName}
        onConfirm={handleConfirmOpenCash}
      />

      <CloseCashSessionModal
        isOpen={isCloseCashModalOpen}
        onClose={() => setIsCloseCashModalOpen(false)}
        cashSession={cashSession}
        closedByLabel={currentUserName}
        onConfirm={handleConfirmCloseCash}
      />

      <CashMovementModal
        isOpen={isCashMovementModalOpen}
        onClose={() => setIsCashMovementModalOpen(false)}
        onConfirm={handleConfirmCashMovement}
      />

      <ConfirmCheckoutModal
        isOpen={isConfirmCheckoutOpen}
        onClose={() => setIsConfirmCheckoutOpen(false)}
        onConfirm={handleFinalConfirm}
        order={currentOrder}
        comprobanteTipo={comprobanteTipo}
        clienteLabel={clienteLabelForConfirm}
        totalAmount={totalAmount}
        paymentBreakdown={paymentBreakdown}
        cashDetail={cashLine ? { amountReceived: cashReceived, changeGiven } : undefined}
      />

      <ReopenSaleModal
        isOpen={!!reopenSaleObj}
        onClose={() => setReopenSaleObj(null)}
        sale={reopenSaleObj}
        clientes={clientes}
        onConfirm={handleConfirmReopen}
      />

      <ReceiptModal
        sale={viewReceiptSale}
        onClose={() => setViewReceiptSale(null)}
        restaurantName={restaurantInfo.name}
        restaurantRuc={restaurantInfo.taxId.replace(/^RUC\s*/i, '')}
        restaurantAddress={restaurantInfo.address}
      />

      {cancelSaleObj && (
        <ConfirmModal
          isOpen={!!cancelSaleObj}
          onClose={() => setCancelSaleObj(null)}
          onConfirm={() => cancelSale(cancelSaleObj!.id, 'Cancelación administrativa')}
          title={`Anular Venta ${cancelSaleObj.serie}-${cancelSaleObj.correlativo}`}
          message={`¿Está seguro de anular la venta por ${cancelSaleObj.total.toFixed(2)} soles? Esta acción no se puede deshacer.`}
          variant="danger"
          confirmText="Anular Venta"
        />
      )}
    </div>
  );
};
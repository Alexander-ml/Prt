// Role definition
export type UserRole = 'Administrador' | 'Mesero' | 'Cocina';

// RF-01 - RF-07: User Accounts
export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

// RF-08 - RF-16: Catalog
export interface Category {
  id: string;
  name: string;
  description: string;
  dishesCount: number;
}

// Estación de cocina responsable de preparar el plato (KDS — vista "Por Estación").
export type KitchenStation = 'frios' | 'plancha' | 'parrilla' | 'postres' | 'bebidas';

// Una línea de la "receta" (bill of materials) de un plato — cuánto insumo
// consume UNA unidad servida del plato. Denormaliza `insumoName` con el
// mismo criterio que `categoryName`/`areaName` en el resto del proyecto.
export interface DishRecipeItem {
  insumoId: string;
  insumoName: string;
  quantityPerServing: number; // cantidad (en insumo.unit) que consume 1 unidad del plato
}

export interface Dish {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  price: number;
  description: string;
  image: string;
  active: boolean; // Permanent availability in menu (RF-13)
  isAvailableToday: boolean; // Momentary service availability (RF-55)
  station: KitchenStation; // Estación de cocina que prepara el plato (KDS)
  prepTimeMinutes: number; // Tiempo estimado de preparación, usado para calcular urgencia real en el KDS
  allergens?: string[]; // Alérgenos relevantes a mostrar siempre en cocina, sin depender de la observación libre
  // OPCIONAL y retrocompatible: un plato sin receta configurada sigue
  // funcionando exactamente igual que antes en Cocina y Pedidos (no afecta
  // stock). Es el vínculo Catálogo↔Inventario que antes no existía.
  recipe?: DishRecipeItem[];
}

// RF-17 - RF-24: Configuration
// El horario se mantiene como una colección de días para que la interfaz no
// tenga que interpretar texto libre. `openingHours` sigue existiendo como
// resumen legible y conserva la retrocompatibilidad con datos anteriores.
export type Weekday =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

export interface RestaurantOpeningDay {
  day: Weekday;
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
}

export interface RestaurantInfo {
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  openingHours: string;
  /** Data URL temporal en el prototipo; posteriormente será una URL del backend. */
  logo?: string;
  /** Configuración semanal opcional para no romper datos existentes. */
  openingSchedule?: RestaurantOpeningDay[];
}

export interface Tax {
  id: string;
  name: string;
  percentage: number;
  active: boolean;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  type: 'dish' | 'category' | 'total';
  targetId?: string; // dishId or categoryId if type is dish/category
  targetName?: string;
  discountPercentage: number;
  active: boolean;
  startDate: string; 
  endDate: string;
}

// RF-25 - RF-38: Areas and Tables
export interface Area {
  id: string;
  name: string;
  description: string;
  tableCount: number;
}

export type TableStatus = 'disponible' | 'ocupada' | 'reservada' | 'limpieza';

export interface Table {
  id: string;
  number: number;
  areaId: string;
  areaName: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  reservationName?: string;
  reservationTime?: string;
  joinedWith?: string[]; // IDs of joined tables RF-37
}

// RF-39 - RF-49: Orders
export type OrderItemStatus = 'pendiente' | 'preparando' | 'listo' | 'entregado' | 'cancelado';

export interface OrderItem {
  id: string;
  dishId: string;
  dishName: string;
  price: number;
  quantity: number;
  observation?: string;
  status: OrderItemStatus;
  addedAt: string;
  cancelReason?: string; // Motivo registrado por cocina cuando status === 'cancelado'
}

export type OrderStatus = 'abierto' | 'en_preparacion' | 'listo' | 'cerrado' | 'cancelado';

// Tipo de servicio de la comanda — afecta cómo cocina prioriza (RF-5x KDS).
export type ServiceType = 'mesa' | 'para_llevar' | 'delivery';

export interface Order {
  id: string;
  tableId: string;
  tableNumber: number;
  areaName: string;
  waiterId: string;
  waiterName: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  sentToKitchenAt?: string;
  cancellationReason?: string;
  serviceType?: ServiceType; // Por defecto se asume 'mesa' cuando no se especifica
  priority?: boolean; // Marcado manual de prioridad (KDS) por cocina o sala
}

// RF-56 - RF-65: Sales & Billing (v2 — flujo Caja → Cobro → Comprobante)
//
// El módulo original solo tenía un botón "Confirmar cierre de venta" sin
// distinguir tipo de comprobante, sin desglose real de forma de pago, sin
// vuelto y sin caja. Este bloque separa esos 4 conceptos que en un
// restaurante real son distintos: (1) qué comprobante se emite, (2) quién
// es el cliente, (3) cómo paga exactamente (uno o varios métodos), y
// (4) el turno de caja en el que ocurre el cobro.

// ── Comprobante y cliente ────────────────────────────────────────────
export type TipoComprobante = 'ticket' | 'boleta' | 'factura';

export type TipoDocumentoCliente = 'DNI' | 'RUC';

export interface Cliente {
  id: string;
  tipoDocumento: TipoDocumentoCliente;
  numeroDocumento: string;
  nombreORazonSocial: string;
  direccion?: string;
  correo?: string;
}

// ── Formas de pago ───────────────────────────────────────────────────
// Categoría amplia: se sigue usando para filtros/reportes que agrupan por
// tipo general (ya no es una opción manual — se deriva de PaymentMethodType).
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'billetera' | 'transferencia' | 'otro' | 'mixto';

// Método concreto que realmente elige el cajero (RF-59 ampliado).
export type PaymentMethodType =
  | 'efectivo'
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'yape'
  | 'plin'
  | 'transferencia'
  | 'vale_consumo'
  | 'credito_interno';

export interface PaymentMethodMeta {
  id: PaymentMethodType;
  label: string;
  icon: string;
  category: PaymentMethod;
}

/** Una línea de pago. Un cobro puede tener 1 (pago único) o varias (pago mixto). */
export interface PaymentSplitEntry {
  id: string;
  method: PaymentMethodType;
  amount: number;
}

/** Detalle exclusivo de la porción pagada en efectivo (para calcular vuelto). */
export interface CashPaymentDetail {
  amountReceived: number;
  changeGiven: number;
}

// ── División de cuenta (RF-58 ampliado) ──────────────────────────────
export type SplitMode = 'equitativo' | 'por_platos';

export interface GuestBillSplit {
  id: string;
  guestName: string;
  items: { orderItemId?: string; dishName: string; quantity: number; amount: number }[];
  totalAmount: number;
  paid: boolean;
  paymentMethod?: PaymentMethodType;
}

// ── Estado del comprobante ────────────────────────────────────────────
export type SaleEstadoPago = 'pagada' | 'facturada' | 'anulada';

export interface Sale {
  id: string;
  serie: string;
  correlativo: number;
  comprobanteTipo: TipoComprobante;
  orderId: string;
  tableNumber: number;
  waiterName: string;
  cashierName: string;
  cajaSesionId?: string;
  cliente?: Cliente;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  discountLabel?: string;
  taxAmount: number;
  igvPercent: number;
  tipAmount: number;
  roundingAdjustment: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentBreakdown: PaymentSplitEntry[];
  cashDetail?: CashPaymentDetail;
  estadoPago: SaleEstadoPago;
  closedAt: string;
  cancellationReason?: string;
  isCancelled: boolean;
  splitMode?: SplitMode;
  splitBills?: GuestBillSplit[];
  editedAt?: string;
  editReason?: string;
}

/** Payload que arma BillingView y consume AppContext.processSaleBilling. */
export interface ProcessSaleBillingParams {
  orderId: string;
  comprobanteTipo: TipoComprobante;
  cliente?: Cliente;
  appliedPromoId?: string;
  discountLabel?: string;
  tipAmount: number;
  paymentBreakdown: PaymentSplitEntry[];
  cashDetail?: CashPaymentDetail;
  splitMode?: SplitMode;
  splitBills?: GuestBillSplit[];
}

/** Payload para corregir el pago/comprobante de una venta ya cerrada (RF-61 — reapertura). */
export interface UpdateSalePaymentParams {
  comprobanteTipo: TipoComprobante;
  cliente?: Cliente;
  paymentBreakdown: PaymentSplitEntry[];
  cashDetail?: CashPaymentDetail;
  reason: string;
}

// ── Caja (turno de cobro) ─────────────────────────────────────────────
export type CashMovementType =
  | 'apertura'
  | 'venta_efectivo'
  | 'venta_no_efectivo'
  | 'ingreso_manual'
  | 'retiro_manual';

export interface CashMovement {
  id: string;
  type: CashMovementType;
  amount: number;
  method?: PaymentMethodType;
  description: string;
  time: string;
  reference?: string;
}

export interface CashSession {
  id: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  initialAmount: number;
  countedCash?: number;
  expectedCash: number;
  difference?: number;
  status: 'abierta' | 'cerrada';
  movements: CashMovement[];
}

// RF-66 - RF-72: Inventory
// Categoría de insumo como entidad real (antes era un array de texto
// hardcodeado en InventoryPage.tsx) — mismo patrón que `Area`.
export interface InsumoCategory {
  id: string;
  name: string;
  description: string;
  insumoCount: number; // denormalizado, igual que Area.tableCount
}

export interface Insumo {
  id: string;
  name: string;
  unit: string; // e.g., 'Kg', 'Lt', 'Unidades', 'Cajas'
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  categoryId: string;
  categoryName: string;
  lastRestockDate: string;
}

// RF-73 - RF-75: Accounting
// Categoría contable como entidad real (antes un <input> de texto libre en
// AccountingPage.tsx) — mismo patrón que `InsumoCategory`/`Area`. `kind`
// determina si aparece como opción al registrar un Ingreso, un Egreso, o
// ambos, en el selector de LedgerEntryFormModal.
export interface LedgerCategory {
  id: string;
  name: string;
  kind: 'ingreso' | 'egreso' | 'ambos';
  description: string;
  entryCount: number; // denormalizado, igual que InsumoCategory.insumoCount
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'ingreso' | 'egreso';
  categoryId: string;
  categoryName: string;
  description: string;
  amount: number;
  reference: string;
}

// FinancialSummary ya NO es un estado que haya que mantener sincronizado a
// mano (ver context/AppContext.tsx): es el tipo de retorno de
// `computeFinancialSummary()` en components/accounting/accountingMeta.ts,
// siempre derivado en vivo de `ledgerEntries` + `sales` para un período
// dado. `period`, `averageTicket` y `transactionsCount` salieron de aquí:
// el período ahora lo describe `PeriodRange.label` (accountingMeta.ts) y
// el ticket promedio/conteo de transacciones ya es responsabilidad de
// Ventas (SalesPage ya los calcula en vivo) — mantenerlos acá era una
// segunda fuente de verdad sin uso real en Contabilidad.
export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  taxCollected: number;
}

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
}

// RF-17 - RF-24: Configuration
export interface RestaurantInfo {
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  openingHours: string;
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
}

export type OrderStatus = 'abierto' | 'en_preparacion' | 'listo' | 'cerrado' | 'cancelado';

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
}

// RF-56 - RF-65: Sales & Billing
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'mixto';

export interface GuestBillSplit {
  id: string;
  guestName: string;
  items: { dishName: string; quantity: number; amount: number }[];
  totalAmount: number;
  paid: boolean;
  paymentMethod?: PaymentMethod;
}

export interface Sale {
  id: string;
  orderId: string;
  tableNumber: number;
  waiterName: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  closedAt: string;
  cancellationReason?: string;
  isCancelled: boolean;
  splitBills?: GuestBillSplit[];
}

// RF-66 - RF-72: Inventory
export interface Insumo {
  id: string;
  name: string;
  unit: string; // e.g., 'Kg', 'Lt', 'Unidades', 'Cajas'
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  category: string;
  lastRestockDate: string;
}

// RF-73 - RF-75: Accounting
export interface FinancialSummary {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  taxCollected: number;
  averageTicket: number;
  transactionsCount: number;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'ingreso' | 'egreso';
  category: string;
  description: string;
  amount: number;
  reference: string;
}

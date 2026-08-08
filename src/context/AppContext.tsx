import React, { createContext, useContext, useState } from 'react';
import type {
  UserRole,
  UserAccount,
  Category,
  Dish,
  RestaurantInfo,
  Tax,
  Promotion,
  Area,
  Table,
  TableStatus,
  Order,
  OrderItem,
  OrderItemStatus,
  ServiceType,
  Sale,
  Cliente,
  CashSession,
  CashMovement,
  TipoComprobante,
  ProcessSaleBillingParams,
  UpdateSalePaymentParams,
  Insumo,
  InsumoCategory,
  DishRecipeItem,
  LedgerEntry,
  LedgerCategory
} from '../types';
import { resolvePaymentCategory } from '../utils/payments';
import { round2, roundToNearestDime, sumMoney } from '../utils/money';

import {
  initialUsers,
  initialCategories,
  initialDishes,
  initialRestaurantInfo,
  initialTaxes,
  initialPromotions,
  initialAreas,
  initialTables,
  initialOrders,
  initialSales,
  initialClientes,
  initialCashSession,
  initialCashSessionHistory,
  initialComprobanteCounters,
  initialInsumos,
  initialInsumoCategories,
  initialLedger,
  initialLedgerCategories
} from '../mock/initialData';

const COMPROBANTE_SERIES: Record<TipoComprobante, string> = {
  ticket: 'T001',
  boleta: 'B001',
  factura: 'F001'
};

export interface ToastMessage {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  title: string;
  message: string;
}

export interface AppContextType {
  // Current Role State
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;

  // Toast System
  toasts: ToastMessage[];
  showToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // Users Module
  users: UserAccount[];
  addUser: (user: Omit<UserAccount, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, data: Partial<UserAccount>) => void;
  toggleUserStatus: (id: string) => void;
  resetUserPassword: (id: string) => void;

  // Catalog Module
  categories: Category[];
  dishes: Dish[];
  addCategory: (name: string, description: string) => void;
  updateCategory: (id: string, name: string, description: string) => void;
  deleteCategory: (id: string) => boolean;
  addDish: (dish: Omit<Dish, 'id' | 'categoryName'>) => string;
  updateDish: (id: string, data: Partial<Dish>) => void;
  toggleDishActive: (id: string) => void;
  toggleDishDailyAvailability: (id: string) => void;
  // Persiste la receta (bill of materials) de un plato ya existente —
  // vínculo Catálogo↔Inventario (ver diagnóstico Inventario, sección 4.1).
  updateDishRecipe: (dishId: string, recipe: DishRecipeItem[]) => void;

  // Config Module
  restaurantInfo: RestaurantInfo;
  updateRestaurantInfo: (info: RestaurantInfo) => void;
  taxes: Tax[];
  addTax: (name: string, percentage: number) => void;
  updateTax: (id: string, data: Partial<Tax>) => void;
  promotions: Promotion[];
  addPromotion: (promo: Omit<Promotion, 'id'>) => void;
  updatePromotion: (id: string, data: Partial<Promotion>) => void;
  togglePromotionActive: (id: string) => void;

  // Areas & Tables Module
  areas: Area[];
  tables: Table[];
  addArea: (name: string, description: string) => void;
  updateArea: (id: string, name: string, description: string) => void;
  deleteArea: (id: string) => boolean;
  addTable: (number: number, areaId: string, capacity: number) => void;
  updateTable: (id: string, data: Partial<Table>) => void;
  deleteTable: (id: string) => void;
  occupyTable: (tableId: string) => void;
  registerTableReservation: (tableId: string, name: string, time: string) => void;
  changeTableStatus: (tableId: string, status: TableStatus) => void;
  joinTables: (tableId1: string, tableId2: string) => void;
  transferTableOrder: (fromTableId: string, toTableId: string) => void;

  // Orders Module
  orders: Order[];
  createOrder: (
    tableId: string,
    waiterId: string,
    waiterName: string,
    items: Omit<OrderItem, 'id' | 'status' | 'addedAt'>[],
    serviceType?: ServiceType
  ) => string;
  updateOrderItemQuantity: (orderId: string, itemId: string, newQuantity: number) => void;
  removeOrderItem: (orderId: string, itemId: string) => void;
  addOrderItemObservation: (orderId: string, itemId: string, observation: string) => void;
  sendOrderToKitchen: (orderId: string) => void;
  addItemsToExistingOrder: (orderId: string, items: Omit<OrderItem, 'id' | 'status' | 'addedAt'>[]) => void;
  cancelOrder: (orderId: string, reason: string) => void;

  // Kitchen KDS Module
  updateOrderItemStatus: (orderId: string, itemId: string, newStatus: OrderItemStatus) => void;
  markOrderReady: (orderId: string) => void;
  notifyDishIndisponibility: (dishId: string, note?: string) => void;
  cancelOrderItem: (orderId: string, itemId: string, reason: string) => void;
  toggleOrderPriority: (orderId: string) => void;

  // Sales & Billing Module — Caja → Cobro → Comprobante
  sales: Sale[];
  processSaleBilling: (params: ProcessSaleBillingParams) => Sale;
  cancelSale: (saleId: string, reason: string) => void;
  updateSalePayment: (saleId: string, params: UpdateSalePaymentParams) => void;

  clientes: Cliente[];
  addCliente: (cliente: Omit<Cliente, 'id'>) => Cliente;

  cashSession: CashSession | null;
  cashSessionHistory: CashSession[];
  openCashSession: (initialAmount: number, openedBy: string) => void;
  closeCashSession: (countedCash: number, closedBy: string) => void;
  registerManualCashMovement: (
    type: 'ingreso_manual' | 'retiro_manual',
    amount: number,
    description: string
  ) => void;

  // Inventory Module
  insumos: Insumo[];
  insumoCategories: InsumoCategory[];
  addInsumo: (insumo: Omit<Insumo, 'id' | 'lastRestockDate' | 'categoryName'>) => void;
  updateInsumo: (id: string, data: Partial<Insumo>) => void;
  registerInsumoMovement: (id: string, quantityDelta: number, isRestock: boolean) => void;
  addInsumoCategory: (name: string, description: string) => void;
  updateInsumoCategory: (id: string, name: string, description: string) => void;
  deleteInsumoCategory: (id: string) => boolean;

  // Accounting Module
  // financialSummary YA NO vive acá como estado: es un valor siempre
  // derivado de ledgerEntries + sales (ver computeFinancialSummary en
  // components/accounting/accountingMeta.ts), así que ningún componente
  // necesita "acordarse" de mantenerlo sincronizado — una venta anulada se
  // refleja sola en los totales, sin ningún cambio adicional acá.
  ledgerEntries: LedgerEntry[];
  ledgerCategories: LedgerCategory[];
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id'>) => void;
  addLedgerCategory: (name: string, kind: LedgerCategory['kind'], description: string) => void;
  updateLedgerCategory: (id: string, name: string, kind: LedgerCategory['kind'], description: string) => void;
  deleteLedgerCategory: (id: string) => boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('Administrador');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, message: string, type: ToastMessage['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // State data
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [dishes, setDishes] = useState<Dish[]>(initialDishes);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>(initialRestaurantInfo);
  const [taxes, setTaxes] = useState<Tax[]>(initialTaxes);
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [areas, setAreas] = useState<Area[]>(initialAreas);
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [cashSession, setCashSession] = useState<CashSession | null>(initialCashSession);
  const [cashSessionHistory, setCashSessionHistory] = useState<CashSession[]>(initialCashSessionHistory);
  const [comprobanteCounters, setComprobanteCounters] = useState(initialComprobanteCounters);
  const [insumos, setInsumos] = useState<Insumo[]>(initialInsumos);
  const [insumoCategories, setInsumoCategories] = useState<InsumoCategory[]>(initialInsumoCategories);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(initialLedger);
  const [ledgerCategories, setLedgerCategories] = useState<LedgerCategory[]>(initialLedgerCategories);

  // --- USER ACTIONS ---
  const addUser = (userData: Omit<UserAccount, 'id' | 'createdAt'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setUsers(prev => [newUser, ...prev]);
    showToast('Usuario Creado', `Se registró exitosamente a ${newUser.name}.`);
  };

  const updateUser = (id: string, data: Partial<UserAccount>) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...data } : u)));
    showToast('Usuario Actualizado', 'Los datos del usuario fueron modificados correctamente.');
  };

  const toggleUserStatus = (id: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const nextActive = !u.active;
          showToast(
            nextActive ? 'Cuenta Activada' : 'Cuenta Desactivada',
            `La cuenta de ${u.name} ahora está ${nextActive ? 'activa' : 'desactivada'}.`,
            nextActive ? 'success' : 'warning'
          );
          return { ...u, active: nextActive };
        }
        return u;
      })
    );
  };

  const resetUserPassword = (id: string) => {
    const user = users.find(u => u.id === id);
    showToast('Contraseña Restablecida', `Se envió el enlace de restablecimiento a ${user?.email || 'el usuario'}.`, 'info');
  };

  // --- CATALOG ACTIONS ---
  const addCategory = (name: string, description: string) => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      description,
      dishesCount: 0
    };
    setCategories(prev => [...prev, newCat]);
    showToast('Categoría Creada', `Categoría "${name}" agregada exitosamente.`);
  };

  const updateCategory = (id: string, name: string, description: string) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, name, description } : c)));
    showToast('Categoría Actualizada', `Se actualizaron los datos de la categoría.`);
  };

  const deleteCategory = (id: string): boolean => {
    const count = dishes.filter(d => d.categoryId === id).length;
    if (count > 0) {
      showToast('No se puede eliminar', `La categoría tiene ${count} platos asociados. Reasigne o elimine los platos primero.`, 'danger');
      return false;
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    showToast('Categoría Eliminada', 'La categoría fue eliminada correctamente.', 'info');
    return true;
  };

  const addDish = (dishData: Omit<Dish, 'id' | 'categoryName'>): string => {
    const cat = categories.find(c => c.id === dishData.categoryId);
    const newDish: Dish = {
      ...dishData,
      id: `d-${Date.now()}`,
      categoryName: cat ? cat.name : 'General'
    };
    setDishes(prev => [newDish, ...prev]);
    if (cat) {
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, dishesCount: c.dishesCount + 1 } : c));
    }
    showToast('Plato Registrado', `"${newDish.name}" fue agregado al catálogo.`);
    return newDish.id;
  };

  const updateDish = (id: string, data: Partial<Dish>) => {
    setDishes(prev => prev.map(d => {
      if (d.id === id) {
        let catName = d.categoryName;
        if (data.categoryId) {
          const found = categories.find(c => c.id === data.categoryId);
          if (found) catName = found.name;
        }
        return { ...d, ...data, categoryName: catName };
      }
      return d;
    }));
    showToast('Plato Actualizado', 'Los detalles del plato fueron actualizados.');
  };

  const toggleDishActive = (id: string) => {
    setDishes(prev => prev.map(d => {
      if (d.id === id) {
        const nextState = !d.active;
        showToast('Menú del Catálogo', `"${d.name}" ${nextState ? 'activado' : 'desactivado'} del menú.`, nextState ? 'success' : 'warning');
        return { ...d, active: nextState };
      }
      return d;
    }));
  };

  const toggleDishDailyAvailability = (id: string) => {
    setDishes(prev => prev.map(d => {
      if (d.id === id) {
        const nextAvailable = !d.isAvailableToday;
        showToast(
          'Disponibilidad del Día (Cocina)',
          `Plato "${d.name}" marcado como ${nextAvailable ? 'DISPONIBLE' : 'AGOTADO / NO DISPONIBLE'}.`,
          nextAvailable ? 'success' : 'warning'
        );
        return { ...d, isAvailableToday: nextAvailable };
      }
      return d;
    }));
  };

  // Persiste la receta (insumos + cantidad por porción) de un plato ya
  // existente. Es el único lugar que escribe `Dish.recipe` — DishesView no
  // necesita conocer cómo se guarda, solo que existe (Dependency Inversion).
  const updateDishRecipe = (dishId: string, recipe: DishRecipeItem[]) => {
    setDishes(prev => prev.map(d => (d.id === dishId ? { ...d, recipe } : d)));
    showToast('Receta Actualizada', 'Los insumos utilizados por el plato fueron guardados.');
  };

  // --- CONFIG ACTIONS ---
  const updateRestaurantInfo = (info: RestaurantInfo) => {
    setRestaurantInfo(info);
    showToast('Configuración Guardada', 'La información general del restaurante fue actualizada.');
  };

  const addTax = (name: string, percentage: number) => {
    const newTax: Tax = { id: `tax-${Date.now()}`, name, percentage, active: true };
    setTaxes(prev => [...prev, newTax]);
    showToast('Impuesto Registrado', `Impuesto "${name}" (${percentage}%) creado.`);
  };

  const updateTax = (id: string, data: Partial<Tax>) => {
    setTaxes(prev => prev.map(t => (t.id === id ? { ...t, ...data } : t)));
    showToast('Impuesto Actualizado', 'Los valores del impuesto han sido guardados.');
  };

  const addPromotion = (promoData: Omit<Promotion, 'id'>) => {
    const newPromo: Promotion = { ...promoData, id: `promo-${Date.now()}` };
    setPromotions(prev => [newPromo, ...prev]);
    showToast('Promoción Creada', `Promoción "${newPromo.name}" registrada con éxito.`);
  };

  const updatePromotion = (id: string, data: Partial<Promotion>) => {
    setPromotions(prev => prev.map(p => (p.id === id ? { ...p, ...data } : p)));
    showToast('Promoción Actualizada', 'Los datos de la promoción fueron modificados.');
  };

  const togglePromotionActive = (id: string) => {
    setPromotions(prev => prev.map(p => (p.id === id ? { ...p, active: !p.active } : p)));
    showToast('Estado de Promoción', 'El estado de la promoción fue actualizado.');
  };

  // --- AREAS & TABLES ACTIONS ---
  const addArea = (name: string, description: string) => {
    const newArea: Area = { id: `area-${Date.now()}`, name, description, tableCount: 0 };
    setAreas(prev => [...prev, newArea]);
    showToast('Área Creada', `Área "${name}" configurada.`);
  };

  const updateArea = (id: string, name: string, description: string) => {
    setAreas(prev => prev.map(a => (a.id === id ? { ...a, name, description } : a)));
    setTables(prev => prev.map(t => t.areaId === id ? { ...t, areaName: name } : t));
    showToast('Área Actualizada', 'Se modificó la información del área.');
  };

  const deleteArea = (id: string): boolean => {
    const count = tables.filter(t => t.areaId === id).length;
    if (count > 0) {
      showToast('No se puede eliminar', `El área contiene ${count} mesas. Reasigne o elimine las mesas primero.`, 'danger');
      return false;
    }
    setAreas(prev => prev.filter(a => a.id !== id));
    showToast('Área Eliminada', 'Área eliminada del sistema.', 'info');
    return true;
  };

  const addTable = (number: number, areaId: string, capacity: number) => {
    const area = areas.find(a => a.id === areaId);
    const newTable: Table = {
      id: `tbl-${Date.now()}`,
      number,
      areaId,
      areaName: area ? area.name : 'General',
      capacity,
      status: 'disponible'
    };
    setTables(prev => [...prev, newTable]);
    if (area) {
      setAreas(prev => prev.map(a => a.id === area.id ? { ...a, tableCount: a.tableCount + 1 } : a));
    }
    showToast('Mesa Creada', `Mesa #${number} agregada al área ${area?.name || ''}.`);
  };

  const updateTable = (id: string, data: Partial<Table>) => {
    setTables(prev => prev.map(t => {
      if (t.id === id) {
        let aName = t.areaName;
        if (data.areaId) {
          const a = areas.find(area => area.id === data.areaId);
          if (a) aName = a.name;
        }
        return { ...t, ...data, areaName: aName };
      }
      return t;
    }));
    showToast('Mesa Actualizada', 'Configuración de mesa guardada.');
  };

  const deleteTable = (id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
    showToast('Mesa Eliminada', 'Mesa eliminada del área.', 'info');
  };

  const occupyTable = (tableId: string) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'ocupada' } : t));
    showToast('Mesa Ocupada', 'La mesa ha pasado a estado OCUPADA.');
  };

  const registerTableReservation = (tableId: string, name: string, time: string) => {
    setTables(prev => prev.map(t => t.id === tableId ? {
      ...t,
      status: 'reservada',
      reservationName: name,
      reservationTime: time
    } : t));
    showToast('Reserva Registrada', `Reserva a nombre de ${name} para las ${time}.`);
  };

  const changeTableStatus = (tableId: string, status: TableStatus) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
    showToast('Estado de Mesa', `Mesa cambiada a estado: ${status.toUpperCase()}.`);
  };

  const joinTables = (tableId1: string, tableId2: string) => {
    const t1 = tables.find(t => t.id === tableId1);
    const t2 = tables.find(t => t.id === tableId2);
    if (!t1 || !t2) return;

    setTables(prev => prev.map(t => {
      if (t.id === tableId1) {
        return { ...t, joinedWith: [...(t.joinedWith || []), `Mesa #${t2.number}`] };
      }
      if (t.id === tableId2) {
        return { ...t, joinedWith: [...(t.joinedWith || []), `Mesa #${t1.number}`] };
      }
      return t;
    }));
    showToast('Mesas Unidas', `Mesa #${t1.number} y Mesa #${t2.number} agrupadas para atención.`);
  };

  const transferTableOrder = (fromTableId: string, toTableId: string) => {
    const fromTable = tables.find(t => t.id === fromTableId);
    const toTable = tables.find(t => t.id === toTableId);
    if (!fromTable || !toTable) return;

    const currentOrder = orders.find(o => o.id === fromTable.currentOrderId || o.tableId === fromTableId && o.status !== 'cerrado');
    if (currentOrder) {
      setOrders(prev => prev.map(o => o.id === currentOrder.id ? {
        ...o,
        tableId: toTableId,
        tableNumber: toTable.number,
        areaName: toTable.areaName
      } : o));
    }

    setTables(prev => prev.map(t => {
      if (t.id === fromTableId) {
        return { ...t, status: 'disponible', currentOrderId: undefined };
      }
      if (t.id === toTableId) {
        return { ...t, status: 'ocupada', currentOrderId: currentOrder?.id };
      }
      return t;
    }));
    showToast('Pedido Trasladado', `El pedido de la Mesa #${fromTable.number} fue reasignado a la Mesa #${toTable.number}.`);
  };

  // --- ORDERS ACTIONS ---
  const createOrder = (
    tableId: string,
    waiterId: string,
    waiterName: string,
    itemsData: Omit<OrderItem, 'id' | 'status' | 'addedAt'>[],
    serviceType?: ServiceType
  ): string => {
    const table = tables.find(t => t.id === tableId);
    const orderId = `ord-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const orderItems: OrderItem[] = itemsData.map((item, idx) => ({
      ...item,
      id: `oi-${Date.now()}-${idx}`,
      status: 'pendiente',
      addedAt: nowTime
    }));

    const newOrder: Order = {
      id: orderId,
      tableId,
      tableNumber: table ? table.number : 0,
      areaName: table ? table.areaName : 'Salón',
      waiterId,
      waiterName,
      items: orderItems,
      status: 'abierto',
      createdAt: new Date().toLocaleString('es-ES'),
      // Por defecto 'mesa' si el constructor de comanda no especifica otro
      // tipo de servicio (para_llevar / delivery), consistente con el resto
      // del sistema donde serviceType ausente se interpreta como 'mesa'.
      serviceType: serviceType ?? 'mesa'
    };

    setOrders(prev => [newOrder, ...prev]);
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'ocupada', currentOrderId: orderId } : t));
    showToast('Pedido Registrado', `Pedido #${orderId.slice(-4)} creado para Mesa #${table?.number}.`);
    return orderId;
  };

  const updateOrderItemQuantity = (orderId: string, itemId: string, newQuantity: number) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updatedItems = o.items.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item);
        return { ...o, items: updatedItems };
      }
      return o;
    }));
  };

  const removeOrderItem = (orderId: string, itemId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, items: o.items.filter(item => item.id !== itemId) };
      }
      return o;
    }));
    showToast('Ítem Eliminado', 'Plato removido del pedido no enviado.', 'info');
  };

  const addOrderItemObservation = (orderId: string, itemId: string, observation: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          items: o.items.map(i => i.id === itemId ? { ...i, observation } : i)
        };
      }
      return o;
    }));
    showToast('Observación Guardada', 'Instrucciones especiales registradas.');
  };

  const sendOrderToKitchen = (orderId: string) => {
    // Formato "HH:mm", consistente con `addedAt` en addItemsToExistingOrder,
    // para que el cálculo de tiempo transcurrido del KDS (getElapsedMinutes)
    // pueda parsearlo de forma confiable.
    const sentTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'en_preparacion',
          // Solo se fija la PRIMERA vez que la comanda entra a cocina. Si ya
          // tenía un sentToKitchenAt (p.ej. se están mandando adicionales a
          // una comanda que ya estaba en preparación), se conserva el
          // original: de lo contrario el cronómetro del ticket completo se
          // reiniciaría cada vez que se agrega un plato, ocultando cuánto
          // llevan esperando los ítems que ya estaban en preparación.
          sentToKitchenAt: o.sentToKitchenAt ?? sentTime,
          items: o.items.map(i => i.status === 'pendiente' ? { ...i, status: 'preparando' } : i)
        };
      }
      return o;
    }));
    showToast('Enviado a Cocina', 'El pedido fue comisionado a la pantalla KDS de Cocina.', 'success');
  };

  const addItemsToExistingOrder = (orderId: string, itemsData: Omit<OrderItem, 'id' | 'status' | 'addedAt'>[]) => {
    const nowTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const newItems: OrderItem[] = itemsData.map((item, idx) => ({
      ...item,
      id: `oi-add-${Date.now()}-${idx}`,
      status: 'pendiente',
      addedAt: nowTime
    }));

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          items: [...o.items, ...newItems],
          status: 'en_preparacion'
        };
      }
      return o;
    }));
    showToast('Adicionales Agregados', 'Se añadieron nuevos platos al pedido existente.');
  };

  const cancelOrder = (orderId: string, reason: string) => {
    const order = orders.find(o => o.id === orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelado', cancellationReason: reason } : o));

    if (order) {
      setTables(prev => prev.map(t => t.id === order.tableId ? { ...t, status: 'disponible', currentOrderId: undefined } : t));
    }
    showToast('Pedido Cancelado', `Motivo de cancelación: ${reason}`, 'warning');
  };

  // --- KITCHEN ACTIONS ---

  // Único punto que sabe "cómo" se descuenta/restaura un insumo por una
  // venta (Dependency Inversion — ver diagnóstico Inventario, sección 4.3).
  // Cocina y Pedidos solo disparan la transición de estado del ítem; nunca
  // calculan el descuento ellos mismos. Un plato sin `recipe` configurada
  // no afecta stock — retrocompatible con todo el catálogo existente.
  // Reusa el mismo clamp a 0 que ya usa `registerInsumoMovement`.
  const consumeRecipeForItem = (item: OrderItem, dish?: Dish) => {
    if (!dish?.recipe?.length) return;
    setInsumos(prev => prev.map(ins => {
      const line = dish.recipe!.find(r => r.insumoId === ins.id);
      if (!line) return ins;
      return { ...ins, currentStock: Math.max(0, ins.currentStock - line.quantityPerServing * item.quantity) };
    }));
  };

  const restoreRecipeForItem = (item: OrderItem, dish?: Dish) => {
    if (!dish?.recipe?.length) return;
    setInsumos(prev => prev.map(ins => {
      const line = dish.recipe!.find(r => r.insumoId === ins.id);
      if (!line) return ins;
      return { ...ins, currentStock: ins.currentStock + line.quantityPerServing * item.quantity };
    }));
  };

  const updateOrderItemStatus = (orderId: string, itemId: string, newStatus: OrderItemStatus) => {
    const order = orders.find(o => o.id === orderId);
    const item = order?.items.find(i => i.id === itemId);
    const previousStatus = item?.status;

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updatedItems = o.items.map(i => i.id === itemId ? { ...i, status: newStatus } : i);
        const allReady = updatedItems.every(i => i.status === 'listo' || i.status === 'entregado' || i.status === 'cancelado');
        return {
          ...o,
          items: updatedItems,
          status: allReady ? 'listo' : 'en_preparacion'
        };
      }
      return o;
    }));

    // Descuento automático de stock (RF-66+): el consumo físico ocurre
    // exactamente en la transición hacia 'listo'. Si Cocina usa el
    // "deshacer" de 5 segundos (vuelve a 'preparando'), se restaura.
    if (item) {
      const dish = dishes.find(d => d.id === item.dishId);
      if (newStatus === 'listo' && previousStatus !== 'listo') {
        consumeRecipeForItem(item, dish);
      } else if (previousStatus === 'listo' && newStatus !== 'listo') {
        restoreRecipeForItem(item, dish);
      }
    }

    showToast('Estado de Cocina', `Ítem actualizado a: ${newStatus.toUpperCase()}`);
  };

  const markOrderReady = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      // Solo se descuenta por ítems que aún no estaban 'listo' (ni
      // 'entregado' ni 'cancelado'), para no descontar dos veces un ítem
      // que ya se había marcado individualmente antes de "Marcar todo listo".
      order.items
        .filter(i => i.status !== 'listo' && i.status !== 'entregado' && i.status !== 'cancelado')
        .forEach(i => consumeRecipeForItem(i, dishes.find(d => d.id === i.dishId)));
    }

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'listo',
          // No se sobrescriben los ítems ya 'cancelado': deben seguir
          // mostrándose como cancelados y no contar como parte de lo servido.
          items: o.items.map(i => i.status === 'cancelado' ? i : { ...i, status: 'listo' })
        };
      }
      return o;
    }));
    showToast('¡Pedido Listo!', 'Se ha notificado al mesero para el recojo en pase.', 'success');
  };

  // Cancela un ítem puntual de una comanda ya comisionada a cocina (p.ej. se
  // agotó el insumo a media preparación). A diferencia de removeOrderItem
  // (que borra el ítem porque el pedido nunca se envió), aquí se conserva el
  // ítem con estado 'cancelado' + motivo, para que quede trazabilidad tanto
  // en el KDS como de cara al mesero/cobro.
  const cancelOrderItem = (orderId: string, itemId: string, reason: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          items: o.items.map(i => i.id === itemId ? { ...i, status: 'cancelado', cancelReason: reason } : i)
        };
      }
      return o;
    }));
    showToast('Ítem Cancelado en Cocina', `Motivo: ${reason}`, 'warning');
  };

  // Marca/desmarca una comanda como prioritaria dentro del KDS (p.ej. un
  // repartidor esperando o una mesa VIP), independiente del tiempo de
  // espera automático.
  const toggleOrderPriority = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, priority: !o.priority } : o));
  };

  // `note` es opcional: permite a cocina dejar un mensaje breve (p.ej. "vuelve
  // en 20 min") que se comunica de inmediato junto con las mesas afectadas
  // que ya tenían el plato pedido en curso.
  const notifyDishIndisponibility = (dishId: string, note?: string) => {
    const dish = dishes.find(d => d.id === dishId);
    const impactedOrders = orders.filter(
      o =>
        (o.status === 'en_preparacion' || o.status === 'listo') &&
        o.items.some(i => i.dishId === dishId && (i.status === 'pendiente' || i.status === 'preparando'))
    );
    toggleDishDailyAvailability(dishId);
    if (impactedOrders.length > 0) {
      const tablesList = impactedOrders.map(o => `Mesa #${o.tableNumber}`).join(', ');
      showToast(
        'Mesas Afectadas por Agotado',
        `${dish?.name ?? 'El plato'} ya estaba pedido en: ${tablesList}. Avisa a sala para ofrecer reemplazo.${note ? ` Nota: ${note}` : ''}`,
        'danger'
      );
    } else if (note) {
      showToast('Nota de Cocina', note, 'info');
    }
  };

  // --- SALES & BILLING ACTIONS ---
  // processSaleBilling recibe un único payload (en vez de varios parámetros
  // sueltos) porque ahora un cobro involucra bastante más que "mesa + forma
  // de pago": tipo de comprobante, cliente, propina y el desglose real de
  // pago (1 o varios métodos). Ese payload lo arma BillingView.
  const processSaleBilling = (params: ProcessSaleBillingParams): Sale => {
    const { orderId, comprobanteTipo, cliente, appliedPromoId, discountLabel, tipAmount, paymentBreakdown, cashDetail, splitMode, splitBills } = params;
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      // processSaleBilling está tipado para devolver siempre un Sale (BillingView
      // depende de eso para abrir el comprobante inmediatamente tras cobrar), así
      // que un pedido inexistente es un error de programación, no un caso de UI a
      // silenciar. Si esto se dispara, hay una desincronización entre lo que
      // BillingView ofrece cobrar y las órdenes reales en memoria.
      showToast('Error al Cobrar', 'El pedido seleccionado ya no existe o fue modificado.', 'danger');
      throw new Error(`processSaleBilling: no existe la orden con id "${orderId}"`);
    }

    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let discountAmount = 0;
    let resolvedDiscountLabel = discountLabel;
    if (appliedPromoId) {
      const promo = promotions.find(p => p.id === appliedPromoId);
      if (promo) {
        discountAmount = round2((subtotal * promo.discountPercentage) / 100);
        resolvedDiscountLabel = resolvedDiscountLabel ?? `${promo.name} (${promo.discountPercentage}%)`;
      }
    }

    const activeIgv = taxes.find(t => t.active && t.name.includes('IGV'));
    const igvPercent = activeIgv ? activeIgv.percentage : 18;
    const taxAmount = round2(((subtotal - discountAmount) * igvPercent) / 100);
    // Redondeo comercial al S/ 0.10 más cercano — se muestra siempre en el
    // resumen (aunque casi siempre sea S/ 0.00) para que nunca sea invisible.
    const { rounded: total, adjustment: roundingAdjustment } = roundToNearestDime(
      subtotal - discountAmount + taxAmount + tipAmount
    );

    const paymentMethod = resolvePaymentCategory(paymentBreakdown.map(p => p.method));
    const serie = COMPROBANTE_SERIES[comprobanteTipo];
    const correlativo = comprobanteCounters[comprobanteTipo];
    setComprobanteCounters(prev => ({ ...prev, [comprobanteTipo]: prev[comprobanteTipo] + 1 }));
    const cashierName = users.find(u => u.role === currentRole && u.active)?.name ?? currentRole;

    const newSale: Sale = {
      id: `ven-${Math.floor(1000 + Math.random() * 9000)}`,
      serie,
      correlativo,
      comprobanteTipo,
      orderId,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      cashierName,
      cajaSesionId: cashSession?.id,
      cliente,
      items: order.items,
      subtotal,
      discountAmount,
      discountLabel: discountAmount > 0 ? resolvedDiscountLabel : undefined,
      taxAmount,
      igvPercent,
      tipAmount,
      roundingAdjustment,
      total,
      paymentMethod,
      paymentBreakdown,
      cashDetail,
      estadoPago: comprobanteTipo === 'factura' ? 'facturada' : 'pagada',
      closedAt: new Date().toLocaleString('es-PE'),
      isCancelled: false,
      splitMode,
      splitBills
    };

    setSales(prev => [newSale, ...prev]);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cerrado' } : o));
    setTables(prev => prev.map(t => t.id === order.tableId ? { ...t, status: 'limpieza', currentOrderId: undefined } : t));

    // Caja: cada línea del desglose de pago queda como movimiento del turno
    // actual (para el arqueo) y solo la porción en efectivo mueve el
    // efectivo esperado en el cajón — tarjetas/billeteras solo se registran
    // para conciliación, no afectan el conteo físico de efectivo.
    if (cashSession && cashSession.status === 'abierta') {
      const now = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      const newMovements = paymentBreakdown.map<CashMovement>((p, idx) => ({
        id: `cm-${Date.now()}-${idx}`,
        type: p.method === 'efectivo' ? 'venta_efectivo' : 'venta_no_efectivo',
        amount: p.amount,
        method: p.method,
        description: `Venta ${serie}-${correlativo} · Mesa #${order.tableNumber}`,
        time: now,
        reference: newSale.id
      }));
      const cashDelta = sumMoney(paymentBreakdown.filter(p => p.method === 'efectivo').map(p => p.amount));
      setCashSession(prev => prev ? {
        ...prev,
        expectedCash: round2(prev.expectedCash + cashDelta),
        movements: [...prev.movements, ...newMovements]
      } : prev);
    }

    // El asiento automático referencia la categoría contable real "Ventas
    // Restobar" (semilla en initialLedgerCategories) — si por algún motivo
    // no existiera, cae a un id vacío en vez de romper el cobro; el nombre
    // denormalizado sigue siendo correcto para mostrar en el Libro Diario.
    const ventasCategory = ledgerCategories.find(c => c.name === 'Ventas Restobar');
    const newLedger: LedgerEntry = {
      id: `led-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'ingreso',
      categoryId: ventasCategory?.id ?? '',
      categoryName: ventasCategory?.name ?? 'Ventas Restobar',
      description: `Cobro ${serie}-${correlativo} - Mesa #${order.tableNumber}`,
      amount: total,
      reference: newSale.id
    };
    setLedgerEntries(prev => [newLedger, ...prev]);
    if (ventasCategory) {
      setLedgerCategories(prev => prev.map(c => c.id === ventasCategory.id ? { ...c, entryCount: c.entryCount + 1 } : c));
    }

    // financialSummary (Ingresos Totales, Utilidad Neta, IGV Recaudado) ya
    // no se actualiza a mano acá: se deriva en vivo de ledgerEntries+sales
    // (accountingMeta.computeFinancialSummary), así que anular esta venta
    // más adelante (cancelSale) excluye este asiento de los totales
    // automáticamente, sin que este código tenga que "acordarse" de nada.
    showToast('Cobro Realizado', `Comprobante ${serie}-${correlativo} por S/ ${total.toFixed(2)} emitido correctamente.`);
    return newSale;
  };

  const cancelSale = (saleId: string, reason: string) => {
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, isCancelled: true, estadoPago: 'anulada', cancellationReason: reason } : s));
    showToast('Venta Anulada', `La venta ${saleId} fue cancelada. Motivo: ${reason}`, 'warning');
  };

  // Reapertura de venta (RF-61): corrige forma de pago / comprobante de una
  // venta ya cerrada dejando trazabilidad (motivo + fecha de edición). No
  // reemplaza el flujo formal de una nota de crédito ante SUNAT para
  // Boleta/Factura ya emitidas — ese caso queda fuera del alcance de este
  // prototipo y debería resolverse con un módulo de notas de crédito.
  const updateSalePayment = (saleId: string, params: UpdateSalePaymentParams) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    const { comprobanteTipo, cliente, paymentBreakdown, cashDetail, reason } = params;
    const paymentMethod = resolvePaymentCategory(paymentBreakdown.map(p => p.method));
    setSales(prev => prev.map(s => s.id === saleId ? {
      ...s,
      comprobanteTipo,
      cliente,
      paymentMethod,
      paymentBreakdown,
      cashDetail,
      estadoPago: comprobanteTipo === 'factura' ? 'facturada' : 'pagada',
      editedAt: new Date().toLocaleString('es-PE'),
      editReason: reason
    } : s));
    showToast('Venta Corregida', `Se actualizó el pago de ${sale.serie}-${sale.correlativo}. Motivo: ${reason}`, 'info');
  };

  // --- CLIENTES (facturación) ---
  const addCliente = (data: Omit<Cliente, 'id'>): Cliente => {
    const nuevo: Cliente = { ...data, id: `cli-${Date.now()}` };
    setClientes(prev => [nuevo, ...prev]);
    showToast('Cliente Registrado', `${nuevo.nombreORazonSocial} quedó disponible para facturación.`, 'info');
    return nuevo;
  };

  // --- CAJA ---
  const openCashSession = (initialAmount: number, openedBy: string) => {
    if (cashSession && cashSession.status === 'abierta') {
      showToast('Caja ya Abierta', 'Ya existe un turno de caja abierto. Ciérrelo antes de abrir uno nuevo.', 'warning');
      return;
    }
    const now = new Date().toLocaleString('es-PE');
    const newSession: CashSession = {
      id: `caja-${Date.now()}`,
      openedAt: now,
      openedBy,
      initialAmount,
      expectedCash: initialAmount,
      status: 'abierta',
      movements: [{ id: `cm-${Date.now()}`, type: 'apertura', amount: initialAmount, description: 'Apertura de caja', time: now }]
    };
    setCashSession(newSession);
    showToast('Caja Abierta', `Turno iniciado con un fondo de S/ ${initialAmount.toFixed(2)}.`);
  };

  const closeCashSession = (countedCash: number, closedBy: string) => {
    if (!cashSession || cashSession.status !== 'abierta') return;
    const closedAt = new Date().toLocaleString('es-PE');
    const difference = round2(countedCash - cashSession.expectedCash);
    const closedSession: CashSession = { ...cashSession, closedAt, closedBy, countedCash, difference, status: 'cerrada' };
    setCashSessionHistory(prev => [closedSession, ...prev]);
    setCashSession(null);
    showToast(
      'Caja Cerrada',
      difference === 0
        ? 'El arqueo cuadra exactamente con lo esperado.'
        : `Diferencia de arqueo: ${difference > 0 ? 'sobrante' : 'faltante'} de S/ ${Math.abs(difference).toFixed(2)}.`,
      difference === 0 ? 'success' : 'warning'
    );
  };

  const registerManualCashMovement = (type: 'ingreso_manual' | 'retiro_manual', amount: number, description: string) => {
    if (!cashSession || cashSession.status !== 'abierta') {
      showToast('Caja Cerrada', 'Debe abrir un turno de caja antes de registrar movimientos.', 'danger');
      return;
    }
    const movement: CashMovement = {
      id: `cm-${Date.now()}`,
      type,
      amount,
      description,
      time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    };
    setCashSession(prev => prev ? {
      ...prev,
      expectedCash: round2(prev.expectedCash + (type === 'ingreso_manual' ? amount : -amount)),
      movements: [...prev.movements, movement]
    } : prev);
    showToast(
      type === 'ingreso_manual' ? 'Ingreso Registrado' : 'Retiro Registrado',
      `${description} — S/ ${amount.toFixed(2)}`,
      'info'
    );
  };

  // --- INVENTORY CATEGORY ACTIONS ---
  // Réplica exacta de addArea/updateArea/deleteArea — mismo patrón que
  // Categorías (Catálogo) y Áreas (Mesas), incluido el bloqueo de borrado
  // con insumos asignados. Resuelve de raíz el bug de categorías
  // hardcodeadas: una categoría nueva es una fila más, no un cambio de código.
  const addInsumoCategory = (name: string, description: string) => {
    const newCat: InsumoCategory = { id: `inscat-${Date.now()}`, name, description, insumoCount: 0 };
    setInsumoCategories(prev => [...prev, newCat]);
    showToast('Categoría de Insumo Creada', `Categoría "${name}" agregada exitosamente.`);
  };

  const updateInsumoCategory = (id: string, name: string, description: string) => {
    setInsumoCategories(prev => prev.map(c => (c.id === id ? { ...c, name, description } : c)));
    setInsumos(prev => prev.map(i => i.categoryId === id ? { ...i, categoryName: name } : i));
    showToast('Categoría de Insumo Actualizada', 'Se actualizaron los datos de la categoría.');
  };

  const deleteInsumoCategory = (id: string): boolean => {
    const count = insumos.filter(i => i.categoryId === id).length;
    if (count > 0) {
      showToast('No se puede eliminar', `La categoría tiene ${count} insumos asociados. Reasigne o elimine los insumos primero.`, 'danger');
      return false;
    }
    setInsumoCategories(prev => prev.filter(c => c.id !== id));
    showToast('Categoría de Insumo Eliminada', 'La categoría fue eliminada correctamente.', 'info');
    return true;
  };

  // --- INVENTORY ACTIONS ---
  const addInsumo = (insumoData: Omit<Insumo, 'id' | 'lastRestockDate' | 'categoryName'>) => {
    const cat = insumoCategories.find(c => c.id === insumoData.categoryId);
    const newInsumo: Insumo = {
      ...insumoData,
      id: `ins-${Date.now()}`,
      categoryName: cat ? cat.name : 'General',
      lastRestockDate: new Date().toISOString().split('T')[0]
    };
    setInsumos(prev => [...prev, newInsumo]);
    if (cat) {
      setInsumoCategories(prev => prev.map(c => c.id === cat.id ? { ...c, insumoCount: c.insumoCount + 1 } : c));
    }
    showToast('Insumo Registrado', `Insumo "${newInsumo.name}" ingresado al sistema.`);
  };

  const updateInsumo = (id: string, data: Partial<Insumo>) => {
    setInsumos(prev => prev.map(i => {
      if (i.id === id) {
        let catName = i.categoryName;
        if (data.categoryId) {
          const found = insumoCategories.find(c => c.id === data.categoryId);
          if (found) catName = found.name;
        }
        return { ...i, ...data, categoryName: catName };
      }
      return i;
    }));
    showToast('Insumo Actualizado', 'Los datos del insumo han sido guardados.');
  };

  const registerInsumoMovement = (id: string, quantityDelta: number, isRestock: boolean) => {
    setInsumos(prev => prev.map(i => {
      if (i.id === id) {
        const nextStock = Math.max(0, isRestock ? i.currentStock + quantityDelta : i.currentStock - quantityDelta);
        return {
          ...i,
          currentStock: nextStock,
          lastRestockDate: isRestock ? new Date().toISOString().split('T')[0] : i.lastRestockDate
        };
      }
      return i;
    }));
    showToast(
      isRestock ? 'Ingreso a Inventario' : 'Consumo / Ajuste de Insumo',
      `Se registró ${isRestock ? '+' : '-'}${quantityDelta} en el stock.`
    );
  };

  // --- ACCOUNTING CATEGORY ACTIONS ---
  // Réplica exacta de addInsumoCategory/updateInsumoCategory/deleteInsumoCategory
  // — mismo patrón, incluido el bloqueo de borrado con asientos asignados.
  // Resuelve de raíz el bug de la categoría de asiento como texto libre: una
  // categoría contable nueva es una fila más, no un valor distinto tipeado
  // a mano cada vez (ver diagnóstico de Contabilidad, Desventaja #5).
  const addLedgerCategory = (name: string, kind: LedgerCategory['kind'], description: string) => {
    const newCat: LedgerCategory = { id: `ledcat-${Date.now()}`, name, kind, description, entryCount: 0 };
    setLedgerCategories(prev => [...prev, newCat]);
    showToast('Categoría Contable Creada', `Categoría "${name}" agregada exitosamente.`);
  };

  const updateLedgerCategory = (id: string, name: string, kind: LedgerCategory['kind'], description: string) => {
    setLedgerCategories(prev => prev.map(c => (c.id === id ? { ...c, name, kind, description } : c)));
    setLedgerEntries(prev => prev.map(e => e.categoryId === id ? { ...e, categoryName: name } : e));
    showToast('Categoría Contable Actualizada', 'Se actualizaron los datos de la categoría.');
  };

  const deleteLedgerCategory = (id: string): boolean => {
    const count = ledgerEntries.filter(e => e.categoryId === id).length;
    if (count > 0) {
      showToast('No se puede eliminar', `La categoría tiene ${count} asientos asociados. Reasigne o elimine los asientos primero.`, 'danger');
      return false;
    }
    setLedgerCategories(prev => prev.filter(c => c.id !== id));
    showToast('Categoría Contable Eliminada', 'La categoría fue eliminada correctamente.', 'info');
    return true;
  };

  // --- ACCOUNTING ACTIONS ---
  const addLedgerEntry = (entryData: Omit<LedgerEntry, 'id'>) => {
    const newEntry: LedgerEntry = {
      ...entryData,
      id: `led-${Date.now()}`
    };
    setLedgerEntries(prev => [newEntry, ...prev]);
    setLedgerCategories(prev => prev.map(c => c.id === entryData.categoryId ? { ...c, entryCount: c.entryCount + 1 } : c));

    // financialSummary ya no se mantiene a mano acá: se deriva en vivo de
    // ledgerEntries (ver components/accounting/accountingMeta.ts), así que
    // este asiento queda reflejado en los KPIs de Contabilidad sin ningún
    // paso adicional.
    showToast('Asiento Contable', `Registro contable guardado (${entryData.type.toUpperCase()}: S/ ${entryData.amount.toFixed(2)}).`);
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        toasts,
        showToast,
        removeToast,
        users,
        addUser,
        updateUser,
        toggleUserStatus,
        resetUserPassword,
        categories,
        dishes,
        addCategory,
        updateCategory,
        deleteCategory,
        addDish,
        updateDish,
        toggleDishActive,
        toggleDishDailyAvailability,
        updateDishRecipe,
        restaurantInfo,
        updateRestaurantInfo,
        taxes,
        addTax,
        updateTax,
        promotions,
        addPromotion,
        updatePromotion,
        togglePromotionActive,
        areas,
        tables,
        addArea,
        updateArea,
        deleteArea,
        addTable,
        updateTable,
        deleteTable,
        occupyTable,
        registerTableReservation,
        changeTableStatus,
        joinTables,
        transferTableOrder,
        orders,
        createOrder,
        updateOrderItemQuantity,
        removeOrderItem,
        addOrderItemObservation,
        sendOrderToKitchen,
        addItemsToExistingOrder,
        cancelOrder,
        updateOrderItemStatus,
        markOrderReady,
        notifyDishIndisponibility,
        cancelOrderItem,
        toggleOrderPriority,
        sales,
        processSaleBilling,
        cancelSale,
        updateSalePayment,
        clientes,
        addCliente,
        cashSession,
        cashSessionHistory,
        openCashSession,
        closeCashSession,
        registerManualCashMovement,
        insumos,
        insumoCategories,
        addInsumo,
        updateInsumo,
        registerInsumoMovement,
        addInsumoCategory,
        updateInsumoCategory,
        deleteInsumoCategory,
        ledgerEntries,
        ledgerCategories,
        addLedgerEntry,
        addLedgerCategory,
        updateLedgerCategory,
        deleteLedgerCategory
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
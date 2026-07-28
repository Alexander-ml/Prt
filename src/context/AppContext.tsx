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
  Sale,
  PaymentMethod,
  GuestBillSplit,
  Insumo,
  LedgerEntry,
  FinancialSummary
} from '../types';

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
  initialInsumos,
  initialLedger,
  initialFinancialSummary
} from '../mock/initialData';

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
  addDish: (dish: Omit<Dish, 'id' | 'categoryName'>) => void;
  updateDish: (id: string, data: Partial<Dish>) => void;
  toggleDishActive: (id: string) => void;
  toggleDishDailyAvailability: (id: string) => void;

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
  createOrder: (tableId: string, waiterId: string, waiterName: string, items: Omit<OrderItem, 'id' | 'status' | 'addedAt'>[]) => string;
  updateOrderItemQuantity: (orderId: string, itemId: string, newQuantity: number) => void;
  removeOrderItem: (orderId: string, itemId: string) => void;
  addOrderItemObservation: (orderId: string, itemId: string, observation: string) => void;
  sendOrderToKitchen: (orderId: string) => void;
  addItemsToExistingOrder: (orderId: string, items: Omit<OrderItem, 'id' | 'status' | 'addedAt'>[]) => void;
  cancelOrder: (orderId: string, reason: string) => void;

  // Kitchen KDS Module
  updateOrderItemStatus: (orderId: string, itemId: string, newStatus: OrderItemStatus) => void;
  markOrderReady: (orderId: string) => void;
  notifyDishIndisponibility: (dishId: string) => void;

  // Sales & Billing Module
  sales: Sale[];
  processSaleBilling: (
    orderId: string,
    paymentMethod: PaymentMethod,
    appliedPromoId?: string,
    splitBills?: GuestBillSplit[]
  ) => void;
  cancelSale: (saleId: string, reason: string) => void;

  // Inventory Module
  insumos: Insumo[];
  addInsumo: (insumo: Omit<Insumo, 'id' | 'lastRestockDate'>) => void;
  updateInsumo: (id: string, data: Partial<Insumo>) => void;
  registerInsumoMovement: (id: string, quantityDelta: number, isRestock: boolean) => void;

  // Accounting Module
  ledgerEntries: LedgerEntry[];
  financialSummary: FinancialSummary;
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id'>) => void;
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
  const [insumos, setInsumos] = useState<Insumo[]>(initialInsumos);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(initialLedger);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>(initialFinancialSummary);

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

  const addDish = (dishData: Omit<Dish, 'id' | 'categoryName'>) => {
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
    itemsData: Omit<OrderItem, 'id' | 'status' | 'addedAt'>[]
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
      createdAt: new Date().toLocaleString('es-ES')
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
    const sentTime = new Date().toLocaleString('es-ES');
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'en_preparacion',
          sentToKitchenAt: sentTime,
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
  const updateOrderItemStatus = (orderId: string, itemId: string, newStatus: OrderItemStatus) => {
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
    showToast('Estado de Cocina', `Ítem actualizado a: ${newStatus.toUpperCase()}`);
  };

  const markOrderReady = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'listo',
          items: o.items.map(i => ({ ...i, status: 'listo' }))
        };
      }
      return o;
    }));
    showToast('¡Pedido Listo!', 'Se ha notificado al mesero para el recojo en pase.', 'success');
  };

  const notifyDishIndisponibility = (dishId: string) => {
    toggleDishDailyAvailability(dishId);
  };

  // --- SALES & BILLING ACTIONS ---
  const processSaleBilling = (
    orderId: string,
    paymentMethod: PaymentMethod,
    appliedPromoId?: string,
    splitBills?: GuestBillSplit[]
  ) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let discountAmount = 0;
    if (appliedPromoId) {
      const promo = promotions.find(p => p.id === appliedPromoId);
      if (promo) {
        discountAmount = (subtotal * promo.discountPercentage) / 100;
      }
    }

    const activeIgv = taxes.find(t => t.active && t.name.includes('IGV'));
    const igvPercent = activeIgv ? activeIgv.percentage : 18;
    const taxAmount = ((subtotal - discountAmount) * igvPercent) / 100;
    const total = (subtotal - discountAmount) + taxAmount;

    const newSale: Sale = {
      id: `ven-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      items: order.items,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      paymentMethod,
      closedAt: new Date().toLocaleString('es-ES'),
      isCancelled: false,
      splitBills
    };

    setSales(prev => [newSale, ...prev]);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cerrado' } : o));
    setTables(prev => prev.map(t => t.id === order.tableId ? { ...t, status: 'limpieza', currentOrderId: undefined } : t));

    const newLedger: LedgerEntry = {
      id: `led-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'ingreso',
      category: 'Ventas Restobar',
      description: `Cobro Venta ${newSale.id} - Mesa #${order.tableNumber}`,
      amount: total,
      reference: newSale.id
    };
    setLedgerEntries(prev => [newLedger, ...prev]);

    setFinancialSummary(prev => ({
      ...prev,
      totalRevenue: prev.totalRevenue + total,
      netProfit: prev.netProfit + total,
      transactionsCount: prev.transactionsCount + 1
    }));

    showToast('Cobro Realizado', `Venta ${newSale.id} por S/ ${total.toFixed(2)} procesada exitosamente con ${paymentMethod.toUpperCase()}.`);
  };

  const cancelSale = (saleId: string, reason: string) => {
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, isCancelled: true, cancellationReason: reason } : s));
    showToast('Venta Anulada', `La venta ${saleId} fue cancelada. Motivo: ${reason}`, 'warning');
  };

  // --- INVENTORY ACTIONS ---
  const addInsumo = (insumoData: Omit<Insumo, 'id' | 'lastRestockDate'>) => {
    const newInsumo: Insumo = {
      ...insumoData,
      id: `ins-${Date.now()}`,
      lastRestockDate: new Date().toISOString().split('T')[0]
    };
    setInsumos(prev => [...prev, newInsumo]);
    showToast('Insumo Registrado', `Insumo "${newInsumo.name}" ingresado al sistema.`);
  };

  const updateInsumo = (id: string, data: Partial<Insumo>) => {
    setInsumos(prev => prev.map(i => (i.id === id ? { ...i, ...data } : i)));
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

  // --- ACCOUNTING ACTIONS ---
  const addLedgerEntry = (entryData: Omit<LedgerEntry, 'id'>) => {
    const newEntry: LedgerEntry = {
      ...entryData,
      id: `led-${Date.now()}`
    };
    setLedgerEntries(prev => [newEntry, ...prev]);

    setFinancialSummary(prev => {
      const isIngreso = entryData.type === 'ingreso';
      const rev = isIngreso ? prev.totalRevenue + entryData.amount : prev.totalRevenue;
      const exp = !isIngreso ? prev.totalExpenses + entryData.amount : prev.totalExpenses;
      return {
        ...prev,
        totalRevenue: rev,
        totalExpenses: exp,
        netProfit: rev - exp
      };
    });
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
        sales,
        processSaleBilling,
        cancelSale,
        insumos,
        addInsumo,
        updateInsumo,
        registerInsumoMovement,
        ledgerEntries,
        financialSummary,
        addLedgerEntry
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

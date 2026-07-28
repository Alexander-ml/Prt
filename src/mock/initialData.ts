import type {
  UserAccount,
  Category,
  Dish,
  RestaurantInfo,
  Tax,
  Promotion,
  Area,
  Table,
  Order,
  Sale,
  Insumo,
  LedgerEntry,
  FinancialSummary
} from '../types';

export const initialUsers: UserAccount[] = [
  {
    id: 'usr-1',
    name: 'Carlos Mendoza',
    email: 'carlos.admin@gourmetos.com',
    role: 'Administrador',
    active: true,
    phone: '+51 987 654 321',
    createdAt: '2026-01-10',
    lastLogin: '2026-07-27 20:15'
  },
  {
    id: 'usr-2',
    name: 'Juan Pérez',
    email: 'juan.perez@gourmetos.com',
    role: 'Mesero',
    active: true,
    phone: '+51 912 345 678',
    createdAt: '2026-02-01',
    lastLogin: '2026-07-27 22:30'
  },
  {
    id: 'usr-3',
    name: 'María García',
    email: 'maria.garcia@gourmetos.com',
    role: 'Mesero',
    active: true,
    phone: '+51 923 456 789',
    createdAt: '2026-03-15',
    lastLogin: '2026-07-27 21:10'
  },
  {
    id: 'usr-4',
    name: 'Chef Mario Rossi',
    email: 'cocina.mario@gourmetos.com',
    role: 'Cocina',
    active: true,
    phone: '+51 934 567 890',
    createdAt: '2026-01-15',
    lastLogin: '2026-07-27 23:00'
  },
  {
    id: 'usr-5',
    name: 'Lucía Torres',
    email: 'lucia.torres@gourmetos.com',
    role: 'Mesero',
    active: false,
    phone: '+51 945 678 901',
    createdAt: '2026-04-10',
    lastLogin: '2026-06-30 18:00'
  }
];

export const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Entradas', description: 'Entradas frías y calientes para compartir', dishesCount: 4 },
  { id: 'cat-2', name: 'Platos Fuertes', description: 'Especialidades a la parrilla y carnes seleccionadas', dishesCount: 5 },
  { id: 'cat-3', name: 'Pastas y Arroces', description: 'Pastas artesanales y arroces de especialidad', dishesCount: 3 },
  { id: 'cat-4', name: 'Postres', description: 'Delicias dulces preparadas al instante', dishesCount: 3 },
  { id: 'cat-5', name: 'Bebidas & Cócteles', description: 'Bebidas frías, jugos naturales y coctelería de autor', dishesCount: 4 }
];

export const initialDishes: Dish[] = [
  {
    id: 'd-1',
    name: 'Ceviche Mixto Tradicional',
    categoryId: 'cat-1',
    categoryName: 'Entradas',
    price: 48.00,
    description: 'Pescado del día, mariscos selectos, camote glaseado, choclo desgranado y leche de tigre rocoto.',
    image: 'https://images.unsplash.com/photo-1535399831370-7642b7450702?auto=format&fit=crop&w=600&q=80',
    active: true,
    isAvailableToday: true
  },
  {
    id: 'd-2',
    name: 'Carpaccio de Lomo Fino',
    categoryId: 'cat-1',
    categoryName: 'Entradas',
    price: 42.00,
    description: 'Lomo de res sellado, láminas de parmesano grana padano, alcaparras y vinagreta de trufa.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    active: true,
    isAvailableToday: true
  },
  {
    id: 'd-3',
    name: 'Tequeños de Queso Andino y Lomo',
    categoryId: 'cat-1',
    categoryName: 'Entradas',
    price: 32.00,
    description: 'Crispy tequeños rellenos con queso andino y lomo salteado, acompañados de salsa guacamole.',
    image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=600&q=80',
    active: true,
    isAvailableToday: true
  },
  {
    id: 'd-4',
    name: 'Lomo Saltado Gourmet',
    categoryId: 'cat-2',
    categoryName: 'Platos Fuertes',
    price: 68.00,
    description: 'Medallones de lomo salteados al wok con cebolla, tomate, ají amarillo, papas amarillas fritas y arroz con choclo.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    active: true,
    isAvailableToday: true
  },
  {
    id: 'd-5',
    name: 'Bife de Ancho Angus (400g)',
    categoryId: 'cat-2',
    categoryName: 'Platos Fuertes',
    price: 95.00,
    description: 'Corte madurado a la parrilla con mantequilla de hierbas, puré rústico y vegetales asados.',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80',
    active: true,
    isAvailableToday: true
  },
  {
    id: 'd-6',
    name: 'Salmon a la Parrilla con Risotto',
    categoryId: 'cat-2',
    categoryName: 'Platos Fuertes',
    price: 76.00,
    description: 'Filete de salmón fresco en salsa de maracuyá con risotto de espárragos verdes.',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
    active: true,
    isAvailableToday: false
  },
  {
    id: 'd-7',
    name: 'Fettuccine en Salsa de Trufa Negra',
    categoryId: 'cat-3',
    categoryName: 'Pastas y Arroces',
    price: 58.00,
    description: 'Pasta artesanal fresca bañada en cremosa salsa de trufa negra, hongos porcini y queso parmesano.',
    image: 'https://images.unsplash.com/photo-1621996346565-e3def6164284?auto=format&fit=crop&w=600&q=80',
    active: true,
    isAvailableToday: true
  },
  {
    id: 'd-8',
    name: 'Arroz con Mariscos al Pisco',
    categoryId: 'cat-3',
    categoryName: 'Pastas y Arroces',
    price: 64.00,
    description: 'Arroz meloso con langostinos, calamares, conchas de abanico, flameado con pisco quebranta.',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
    active: true,
    isAvailableToday: true
  },
  {
    id: 'd-9',
    name: 'Volcán de Chocolate con Helado',
    categoryId: 'cat-4',
    categoryName: 'Postres',
    price: 28.00,
    description: 'Bizcocho tibio de chocolate 70% cacao con centro fluido, acompañado de helado de vainilla bourbon.',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    active: true,
    isAvailableToday: true
  },
  {
    id: 'd-10',
    name: 'Cheesecake de Lucuma',
    categoryId: 'cat-4',
    categoryName: 'Postres',
    price: 26.00,
    description: 'Suave crema de lúcuma nativa sobre crocante galleta y reducción de frutos rojos.',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80',
    active: true,
    isAvailableToday: true
  },
  {
    id: 'd-11',
    name: 'Pisco Sour Catedral',
    categoryId: 'cat-5',
    categoryName: 'Bebidas & Cócteles',
    price: 32.00,
    description: 'Pisco quebranta de reserva, jugo de limón fresco, jarabe de goma, clara de huevo y gotas de amargo de angostura.',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
    active: true,
    isAvailableToday: true
  },
  {
    id: 'd-12',
    name: 'Limonada de Hierba Luisa y Jengibre',
    categoryId: 'cat-5',
    categoryName: 'Bebidas & Cócteles',
    price: 16.00,
    description: 'Refrescante limonada natural infusionada con hierba luisa y un toque sutil de jengibre.',
    image: 'https://images.unsplash.com/photo-1523371054106-bbf80586c38c?auto=format&fit=crop&w=600&q=80',
    active: true,
    isAvailableToday: true
  }
];

export const initialRestaurantInfo: RestaurantInfo = {
  name: 'Restaurante GourmetOS Bistro',
  taxId: 'RUC 20601234567',
  address: 'Av. La Mar 1240, Miraflores, Lima',
  phone: '+51 1 445-8900',
  email: 'contacto@gourmetosbistro.pe',
  currency: 'S/',
  openingHours: 'Lunes a Domingo: 12:00 PM - 11:30 PM'
};

export const initialTaxes: Tax[] = [
  { id: 'tax-1', name: 'IGV (Impuesto General a las Ventas)', percentage: 18, active: true },
  { id: 'tax-2', name: 'Recargo al Servicio', percentage: 10, active: false }
];

export const initialPromotions: Promotion[] = [
  {
    id: 'promo-1',
    code: 'HAPPY15',
    name: 'Happy Hour Cócteles 15% OFF',
    type: 'category',
    targetId: 'cat-5',
    targetName: 'Bebidas & Cócteles',
    discountPercentage: 15,
    active: true,
    startDate: '2026-07-01',
    endDate: '2026-08-31'
  },
  {
    id: 'promo-2',
    code: 'ALMUERZO10',
    name: 'Descuento Ejecutivo 10%',
    type: 'total',
    discountPercentage: 10,
    active: true,
    startDate: '2026-07-15',
    endDate: '2026-12-31'
  }
];

export const initialAreas: Area[] = [
  { id: 'area-1', name: 'Salón Principal', description: 'Zona interior climatizada con iluminación cálida', tableCount: 6 },
  { id: 'area-2', name: 'Terraza VIP', description: 'Vista exterior con calefacción de ambiente', tableCount: 4 },
  { id: 'area-3', name: 'Barra & Lounge', description: 'Área informal cerca a la barra de coctelería', tableCount: 3 },
  { id: 'area-4', name: 'Jardín Exterior', description: 'Mesas al aire libre rodeadas de áreas verdes', tableCount: 3 }
];

export const initialTables: Table[] = [
  { id: 'tbl-1', number: 1, areaId: 'area-1', areaName: 'Salón Principal', capacity: 4, status: 'ocupada', currentOrderId: 'ord-1' },
  { id: 'tbl-2', number: 2, areaId: 'area-1', areaName: 'Salón Principal', capacity: 2, status: 'ocupada', currentOrderId: 'ord-2' },
  { id: 'tbl-3', number: 3, areaId: 'area-1', areaName: 'Salón Principal', capacity: 6, status: 'disponible' },
  { id: 'tbl-4', number: 4, areaId: 'area-1', areaName: 'Salón Principal', capacity: 4, status: 'reservada', reservationName: 'Familia Ramírez', reservationTime: '21:00' },
  { id: 'tbl-5', number: 5, areaId: 'area-1', areaName: 'Salón Principal', capacity: 2, status: 'limpieza' },
  { id: 'tbl-6', number: 6, areaId: 'area-1', areaName: 'Salón Principal', capacity: 8, status: 'disponible' },

  { id: 'tbl-7', number: 7, areaId: 'area-2', areaName: 'Terraza VIP', capacity: 4, status: 'ocupada', currentOrderId: 'ord-3' },
  { id: 'tbl-8', number: 8, areaId: 'area-2', areaName: 'Terraza VIP', capacity: 4, status: 'disponible' },
  { id: 'tbl-9', number: 9, areaId: 'area-2', areaName: 'Terraza VIP', capacity: 6, status: 'reservada', reservationName: 'Empresa TechCorp', reservationTime: '21:30' },
  { id: 'tbl-10', number: 10, areaId: 'area-2', areaName: 'Terraza VIP', capacity: 2, status: 'disponible' },

  { id: 'tbl-11', number: 11, areaId: 'area-3', areaName: 'Barra & Lounge', capacity: 2, status: 'disponible' },
  { id: 'tbl-12', number: 12, areaId: 'area-3', areaName: 'Barra & Lounge', capacity: 2, status: 'disponible' },
  { id: 'tbl-13', number: 13, areaId: 'area-3', areaName: 'Barra & Lounge', capacity: 4, status: 'limpieza' },

  { id: 'tbl-14', number: 14, areaId: 'area-4', areaName: 'Jardín Exterior', capacity: 6, status: 'disponible' },
  { id: 'tbl-15', number: 15, areaId: 'area-4', areaName: 'Jardín Exterior', capacity: 4, status: 'disponible' },
  { id: 'tbl-16', number: 16, areaId: 'area-4', areaName: 'Jardín Exterior', capacity: 4, status: 'disponible' }
];

export const initialOrders: Order[] = [
  {
    id: 'ord-1',
    tableId: 'tbl-1',
    tableNumber: 1,
    areaName: 'Salón Principal',
    waiterId: 'usr-2',
    waiterName: 'Juan Pérez',
    status: 'en_preparacion',
    createdAt: '2026-07-27 20:30',
    sentToKitchenAt: '2026-07-27 20:34',
    items: [
      { id: 'oi-1', dishId: 'd-1', dishName: 'Ceviche Mixto Tradicional', price: 48.00, quantity: 1, observation: 'Sin picante en la leche de tigre', status: 'listo', addedAt: '20:30' },
      { id: 'oi-2', dishId: 'd-4', dishName: 'Lomo Saltado Gourmet', price: 68.00, quantity: 2, observation: 'Término medio para la carne', status: 'preparando', addedAt: '20:30' },
      { id: 'oi-3', dishId: 'd-11', dishName: 'Pisco Sour Catedral', price: 32.00, quantity: 2, status: 'listo', addedAt: '20:30' }
    ]
  },
  {
    id: 'ord-2',
    tableId: 'tbl-2',
    tableNumber: 2,
    areaName: 'Salón Principal',
    waiterId: 'usr-3',
    waiterName: 'María García',
    status: 'en_preparacion',
    createdAt: '2026-07-27 20:45',
    sentToKitchenAt: '2026-07-27 20:48',
    items: [
      { id: 'oi-4', dishId: 'd-2', dishName: 'Carpaccio de Lomo Fino', price: 42.00, quantity: 1, observation: 'Extra alcaparras', status: 'preparando', addedAt: '20:45' },
      { id: 'oi-5', dishId: 'd-7', dishName: 'Fettuccine en Salsa de Trufa Negra', price: 58.00, quantity: 1, status: 'pendiente', addedAt: '20:45' },
      { id: 'oi-6', dishId: 'd-12', dishName: 'Limonada de Hierba Luisa y Jengibre', price: 16.00, quantity: 2, status: 'listo', addedAt: '20:45' }
    ]
  },
  {
    id: 'ord-3',
    tableId: 'tbl-7',
    tableNumber: 7,
    areaName: 'Terraza VIP',
    waiterId: 'usr-2',
    waiterName: 'Juan Pérez',
    status: 'listo',
    createdAt: '2026-07-27 20:10',
    sentToKitchenAt: '2026-07-27 20:12',
    items: [
      { id: 'oi-7', dishId: 'd-5', dishName: 'Bife de Ancho Angus (400g)', price: 95.00, quantity: 2, observation: 'Término 3/4 con chimichurri', status: 'listo', addedAt: '20:10' },
      { id: 'oi-8', dishId: 'd-8', dishName: 'Arroz con Mariscos al Pisco', price: 64.00, quantity: 1, status: 'listo', addedAt: '20:10' },
      { id: 'oi-9', dishId: 'd-9', dishName: 'Volcán de Chocolate con Helado', price: 28.00, quantity: 2, status: 'listo', addedAt: '20:10' }
    ]
  }
];

export const initialSales: Sale[] = [
  {
    id: 'ven-1001',
    orderId: 'ord-prev-1',
    tableNumber: 4,
    waiterName: 'Juan Pérez',
    subtotal: 210.00,
    taxAmount: 37.80,
    discountAmount: 0,
    total: 247.80,
    paymentMethod: 'tarjeta',
    closedAt: '2026-07-27 19:40',
    isCancelled: false,
    items: [
      { id: 's-1', dishId: 'd-4', dishName: 'Lomo Saltado Gourmet', price: 68.00, quantity: 2, status: 'entregado', addedAt: '18:40' },
      { id: 's-2', dishId: 'd-11', dishName: 'Pisco Sour Catedral', price: 32.00, quantity: 2, status: 'entregado', addedAt: '18:40' },
      { id: 's-3', dishId: 'd-10', dishName: 'Cheesecake de Lucuma', price: 26.00, quantity: 1, status: 'entregado', addedAt: '19:15' }
    ]
  },
  {
    id: 'ven-1002',
    orderId: 'ord-prev-2',
    tableNumber: 8,
    waiterName: 'María García',
    subtotal: 154.00,
    taxAmount: 27.72,
    discountAmount: 15.40,
    total: 166.32,
    paymentMethod: 'efectivo',
    closedAt: '2026-07-27 20:05',
    isCancelled: false,
    items: [
      { id: 's-4', dishId: 'd-1', dishName: 'Ceviche Mixto Tradicional', price: 48.00, quantity: 2, status: 'entregado', addedAt: '19:10' },
      { id: 's-5', dishId: 'd-7', dishName: 'Fettuccine en Salsa de Trufa Negra', price: 58.00, quantity: 1, status: 'entregado', addedAt: '19:10' }
    ]
  },
  {
    id: 'ven-1003',
    orderId: 'ord-prev-3',
    tableNumber: 12,
    waiterName: 'Juan Pérez',
    subtotal: 96.00,
    taxAmount: 17.28,
    discountAmount: 0,
    total: 113.28,
    paymentMethod: 'mixto',
    closedAt: '2026-07-27 20:25',
    isCancelled: false,
    items: [
      { id: 's-6', dishId: 'd-3', dishName: 'Tequeños de Queso Andino y Lomo', price: 32.00, quantity: 2, status: 'entregado', addedAt: '19:30' },
      { id: 's-7', dishId: 'd-11', dishName: 'Pisco Sour Catedral', price: 32.00, quantity: 1, status: 'entregado', addedAt: '19:30' }
    ]
  }
];

export const initialInsumos: Insumo[] = [
  { id: 'ins-1', name: 'Lomo Fino de Res Premium', unit: 'Kg', currentStock: 8.5, minStock: 10.0, costPerUnit: 45.00, category: 'Carnes', lastRestockDate: '2026-07-25' },
  { id: 'ins-2', name: 'Pescado Corvina Fresco', unit: 'Kg', currentStock: 14.0, minStock: 8.0, costPerUnit: 38.00, category: 'Mariscos', lastRestockDate: '2026-07-27' },
  { id: 'ins-3', name: 'Pisco Quebranta 750ml', unit: 'Botella', currentStock: 4.0, minStock: 6.0, costPerUnit: 42.00, category: 'Licores', lastRestockDate: '2026-07-20' },
  { id: 'ins-4', name: 'Arroz Extra Superior', unit: 'Kg', currentStock: 45.0, minStock: 20.0, costPerUnit: 4.20, category: 'Abarrotes', lastRestockDate: '2026-07-22' },
  { id: 'ins-5', name: 'Queso Parmesano Grana Padano', unit: 'Kg', currentStock: 2.1, minStock: 3.0, costPerUnit: 85.00, category: 'Lácteos', lastRestockDate: '2026-07-18' },
  { id: 'ins-6', name: 'Aceite de Trufa Negra 250ml', unit: 'Botella', currentStock: 1.5, minStock: 2.0, costPerUnit: 120.00, category: 'Especiales', lastRestockDate: '2026-07-10' },
  { id: 'ins-7', name: 'Limón Sutil Seleccionado', unit: 'Kg', currentStock: 25.0, minStock: 12.0, costPerUnit: 3.50, category: 'Verduras', lastRestockDate: '2026-07-27' },
  { id: 'ins-8', name: 'Chocolate 70% Cacao Bitter', unit: 'Kg', currentStock: 5.0, minStock: 4.0, costPerUnit: 34.00, category: 'Repostería', lastRestockDate: '2026-07-24' }
];

export const initialLedger: LedgerEntry[] = [
  { id: 'led-1', date: '2026-07-27', type: 'ingreso', category: 'Ventas Restobar', description: 'Consolidadas Ventas Turno Almuerzo', amount: 3420.50, reference: 'POS-2026-0727-A' },
  { id: 'led-2', date: '2026-07-27', type: 'ingreso', category: 'Ventas Restobar', description: 'Ventas en progreso Turno Noche', amount: 1850.00, reference: 'POS-2026-0727-N' },
  { id: 'led-3', date: '2026-07-26', type: 'egreso', category: 'Insumos & Proveedores', description: 'Compra de Mariscos y Pescado Fresco - Distribuidora del Mar', amount: 840.00, reference: 'FAC-E001-4491' },
  { id: 'led-4', date: '2026-07-25', type: 'egreso', category: 'Servicios Básicos', description: 'Pago Luz y Gas Industrial Julio', amount: 1250.00, reference: 'REC-998231' },
  { id: 'led-5', date: '2026-07-24', type: 'egreso', category: 'Insumos & Proveedores', description: 'Abastecimiento Licores y Pisco - Bodega Tabernero', amount: 920.00, reference: 'FAC-B002-1182' }
];

export const initialFinancialSummary: FinancialSummary = {
  period: 'Julio 2026 (Mes Actual)',
  totalRevenue: 48950.00,
  totalExpenses: 21400.00,
  netProfit: 27550.00,
  taxCollected: 8811.00,
  averageTicket: 168.50,
  transactionsCount: 290
};

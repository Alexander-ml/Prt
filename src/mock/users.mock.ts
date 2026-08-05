import type { UserAccount } from '../types';

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

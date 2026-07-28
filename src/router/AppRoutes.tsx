import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layout/MainLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { UsersPage } from '../pages/UsersPage';
import { CatalogPage } from '../pages/CatalogPage';
import { ConfigPage } from '../pages/ConfigPage';
import { TablesPage } from '../pages/TablesPage';
import { OrdersPage } from '../pages/OrdersPage';
import { KitchenPage } from '../pages/KitchenPage';
import { SalesPage } from '../pages/SalesPage';
import { InventoryPage } from '../pages/InventoryPage';
import { AccountingPage } from '../pages/AccountingPage';

export const AppRoutes: React.FC = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/configuracion" element={<ConfigPage />} />
        <Route path="/mesas" element={<TablesPage />} />
        <Route path="/pedidos" element={<OrdersPage />} />
        <Route path="/cocina" element={<KitchenPage />} />
        <Route path="/ventas" element={<SalesPage />} />
        <Route path="/inventario" element={<InventoryPage />} />
        <Route path="/contabilidad" element={<AccountingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
};

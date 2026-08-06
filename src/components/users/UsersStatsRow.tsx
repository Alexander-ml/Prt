import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';

/**
 * UsersStatsRow — Fila de 3 StatCards con el resumen del personal
 * (Total / Activos / Inactivos). Lee `useApp()` directamente, igual que
 * `CatalogStatsRow`, para que `UsersPage` no tenga que calcular ni pasar
 * estos datos hacia abajo.
 */
export const UsersStatsRow: React.FC = () => {
  const { users } = useApp();

  const activeUsersCount = users.filter(u => u.active).length;
  const inactiveUsersCount = users.filter(u => !u.active).length;

  return (
    <div className="row g-3 mb-4 stagger-children">
      <div className="col-12 col-sm-4">
        <StatCard
          title="Total Personal"
          value={users.length}
          subtitle="Cuentas registradas"
          icon="bi-people-fill"
          colorTheme="indigo"
        />
      </div>
      <div className="col-12 col-sm-4">
        <StatCard
          title="Usuarios Activos"
          value={activeUsersCount}
          subtitle="Con acceso habilitado"
          icon="bi-person-check-fill"
          colorTheme="emerald"
        />
      </div>
      <div className="col-12 col-sm-4">
        <StatCard
          title="Usuarios Inactivos"
          value={inactiveUsersCount}
          subtitle="Acceso deshabilitado"
          icon="bi-person-dash-fill"
          colorTheme="rose"
        />
      </div>
    </div>
  );
};
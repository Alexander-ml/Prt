import React from 'react';
import { SectionCard } from '../common/SectionCard';
import { SearchBar } from '../common/SearchBar';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';
import { ROLE_FILTER_OPTIONS } from './userRoleMeta';

interface UsersFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedRole: string;
  onRoleChange: (value: string) => void;
}

/**
 * UsersFilterBar — SectionCard con la búsqueda y el filtro de Rol del
 * listado de personal. Componente controlado, sin estado propio: la
 * búsqueda/filtro viven en `UsersPage` porque `UserTable`/`UsersMobileList`
 * los comparten (un solo dominio, una sola lista filtrada) — igual
 * criterio que `OrdersStatsRow` frente a su página.
 *
 * Cada control lleva su etiqueta (BUSCAR / ROL) encima, mismo criterio
 * "label → control" que `DishFilterBar` en Catálogo (`.catalog-filter-*`),
 * en vez del `label` lateral que tenía antes.
 *
 * Las opciones del select de rol salen de `ROLE_FILTER_OPTIONS`
 * (userRoleMeta.ts), no de un array declarado a mano aquí.
 */
export const UsersFilterBar: React.FC<UsersFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedRole,
  onRoleChange,
}) => {
  return (
    <SectionCard icon="bi-funnel" title="Filtros y Búsqueda de Personal" className="mb-4">
      <div className="users-filter-grid">
        <div className="users-filter-search">
          <label id="userSearchLabel" htmlFor="userSearchInput" className="users-filter-label">Buscar</label>
          <SearchBar
            id="userSearchInput"
            labelledBy="userSearchLabel"
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Buscar personal por nombre o correo..."
          />
        </div>
        <div>
          <span id="roleFilterLabel" className="users-filter-label">Rol</span>
          <CustomDropdownSelect
            id="roleFilterSelect"
            labelId="roleFilterLabel"
            value={selectedRole}
            onChange={onRoleChange}
            size="sm"
            options={ROLE_FILTER_OPTIONS}
          />
        </div>
      </div>
    </SectionCard>
  );
};

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
 * búsqueda/filtro viven en `UsersPage` porque `UserTable` los comparte
 * (un solo dominio, una sola lista filtrada) — igual criterio que
 * `OrdersStatsRow` frente a su página.
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
      <div className="row g-3 align-items-center">
        <div className="col-12 col-md-6">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Buscar personal por nombre o correo..."
          />
        </div>
        <div className="col-12 col-md-6 d-flex align-items-center justify-content-md-end gap-2">
          <label id="roleFilterLabel" className="fs-7 text-muted fw-semibold me-1 text-nowrap">Filtrar por Rol:</label>
          <div style={{ minWidth: 200 }}>
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
      </div>
    </SectionCard>
  );
};
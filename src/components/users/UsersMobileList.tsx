import React from 'react';
import type { UserAccount } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import { ROLE_META, getAvatarStyle } from './userRoleMeta';

interface UsersMobileListEmptyState {
  icon: string;
  title: string;
  description: string;
}

interface UsersMobileListProps {
  users: UserAccount[];
  onEdit: (user: UserAccount) => void;
  onResetPassword: (user: UserAccount) => void;
  onRequestStatusToggle: (user: UserAccount) => void;
  emptyState: UsersMobileListEmptyState;
}

/**
 * UsersMobileList — Listado de personal para móvil, en bloques compactos
 * (`article` por cuenta) en vez de una tabla comprimida. Mismo lenguaje
 * visual que `TablesConfigMobileLists` (Áreas y Mesas): encabezado con
 * identidad + estado, datos secundarios en `dl`, acciones siempre
 * visibles y con texto (nunca solo íconos ambiguos).
 *
 * Recibe exactamente los mismos datos y handlers que `UserTable` — no
 * duplica filtros, permisos ni lógica de negocio: `UsersPage` sigue
 * siendo la única fuente de `filteredUsers`.
 *
 * Jerarquía priorizada (Nombre/Correo → Rol → Estado → Teléfono/Último
 * acceso → Acciones), según el criterio Mobile del módulo.
 */
export const UsersMobileList: React.FC<UsersMobileListProps> = ({
  users,
  onEdit,
  onResetPassword,
  onRequestStatusToggle,
  emptyState,
}) => {
  if (users.length === 0) {
    return <EmptyState icon={emptyState.icon} title={emptyState.title} description={emptyState.description} />;
  }

  return (
    <div className="users-mobile-list" aria-label="Cuentas del equipo">
      {users.map(user => {
        const roleMeta = ROLE_META[user.role];
        return (
          <article className="users-mobile-item" key={user.id}>
            <div className="users-mobile-item-heading">
              <div className="users-mobile-item-identity">
                <div
                  className="rounded-circle fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 38, height: 38, fontSize: '0.9rem', ...getAvatarStyle(user.role) }}
                >
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                </div>
              </div>
              <Badge
                status={user.active ? 'Activa' : 'Desactivada'}
                variant={user.active ? 'success' : 'secondary'}
              />
            </div>

            <div className="users-mobile-item-role">
              <Badge status={roleMeta.label} variant={roleMeta.badgeVariant} icon={roleMeta.icon} />
            </div>

            <dl className="users-mobile-details">
              <div><dt>Teléfono</dt><dd>{user.phone || 'No registrado'}</dd></div>
              <div><dt>Último acceso</dt><dd>{user.lastLogin || 'Nunca'}</dd></div>
            </dl>

            <div className="users-mobile-actions">
              <button type="button" className="btn btn-brand-outline" onClick={() => onEdit(user)}>
                <i className="bi bi-pencil-fill" aria-hidden="true"></i> <span>Editar</span>
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => onResetPassword(user)}>
                <i className="bi bi-key-fill" aria-hidden="true"></i> <span>Contraseña</span>
              </button>
              <button
                type="button"
                className={`btn ${user.active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                onClick={() => onRequestStatusToggle(user)}
              >
                <i className={`bi ${user.active ? 'bi-person-slash' : 'bi-person-check-fill'}`} aria-hidden="true"></i>{' '}
                <span>{user.active ? 'Desactivar' : 'Activar'}</span>
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
};

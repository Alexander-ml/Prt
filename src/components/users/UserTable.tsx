import React from 'react';
import type { UserAccount } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import { ROLE_META, getAvatarStyle } from './userRoleMeta';

interface UserTableProps {
  users: UserAccount[];
  onEdit: (user: UserAccount) => void;
  onResetPassword: (user: UserAccount) => void;
  onRequestStatusToggle: (user: UserAccount) => void;
}

/**
 * UserTable — Tabla de personal, presentacional pura. No recibe nada del
 * formulario de alta/edición (Interface Segregation) — solo lo necesario
 * para listar cuentas y disparar sus 3 acciones por fila.
 *
 * El color del avatar y la variante del Badge de rol salen de `ROLE_META`
 * (userRoleMeta.ts) — sin ternarios manuales de color, y sin fallback
 * silencioso: un rol no declarado en `ROLE_META` simplemente no compila
 * (TypeScript lo exige vía `Record<UserRole, RoleMeta>`).
 *
 * Incluye `EmptyState` cuando el filtro no devuelve resultados, igual que
 * `CategoryTable` y `TablesConfigView`.
 */
export const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onResetPassword, onRequestStatusToggle }) => {
  return (
    <div className="table-responsive-x">
      <div className="custom-table-container">
        <table className="custom-table" style={{ minWidth: 650 }}>
          <thead>
            <tr>
              <th>Personal</th>
              <th>Rol Asignado</th>
              <th>Teléfono</th>
              <th>Estado Cuenta</th>
              <th>Último Acceso</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  <EmptyState
                    title="No se encontraron usuarios"
                    description="Intenta cambiar los filtros de búsqueda o registra un nuevo usuario."
                  />
                </td>
              </tr>
            ) : (
              users.map(user => {
                const roleMeta = ROLE_META[user.role];
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-circle fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: 38,
                            height: 38,
                            fontSize: '0.9rem',
                            ...getAvatarStyle(user.role),
                          }}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="fw-bold" style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{user.name}</div>
                          <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{user.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge status={roleMeta.label} variant={roleMeta.badgeVariant} />
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{user.phone || 'No registrado'}</span>
                    </td>
                    <td>
                      <Badge
                        status={user.active ? 'Activa' : 'Desactivada'}
                        variant={user.active ? 'success' : 'secondary'}
                      />
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{user.lastLogin || 'Nunca'}</span>
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        <button
                          type="button"
                          className="btn-icon btn-icon-primary"
                          title="Editar datos"
                          onClick={() => onEdit(user)}
                        >
                          <i className="bi bi-pencil-fill"></i>
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Restablecer Contraseña"
                          onClick={() => onResetPassword(user)}
                        >
                          <i className="bi bi-key-fill"></i>
                        </button>
                        <button
                          type="button"
                          className={`btn-icon ${user.active ? 'btn-icon-danger' : 'btn-icon-success'}`}
                          title={user.active ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                          onClick={() => onRequestStatusToggle(user)}
                        >
                          <i className={`bi ${user.active ? 'bi-person-slash' : 'bi-person-check-fill'}`}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { UserAccount, UserRole } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { StatCard } from '../components/common/StatCard';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { EmptyState } from '../components/common/EmptyState';

export const UsersPage: React.FC = () => {
  const { users, addUser, updateUser, toggleUserStatus, resetUserPassword, currentRole } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('todos');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Mesero' as UserRole
  });

  // Confirm Deactivation Modal
  const [confirmUser, setConfirmUser] = useState<UserAccount | null>(null);

  // Filtered users (RF-05, RF-06, RF-07)
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === 'todos' || user.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRole]);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', phone: '', role: 'Mesero' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role
      });
    } else {
      addUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        active: true
      });
    }
    setIsModalOpen(false);
  };

  if (currentRole !== 'Administrador') {
    return (
      <div className="container-fluid p-0">
        <EmptyState
          icon="bi-shield-lock"
          title="Acceso Restringido"
          description="Este módulo es administrado únicamente por usuarios con rol de Administrador."
        />
      </div>
    );
  }

  const activeUsersCount = users.filter(u => u.active).length;
  const inactiveUsersCount = users.filter(u => !u.active).length;

  return (
    <div className="container-fluid p-0">
      {/* Page Header */}
      <PageHeader
        icon="bi-people-fill"
        title="Personal y Usuarios"
        subtitle="Alta, edición, activación y control de acceso del personal del restaurante."
        actions={
          <button
            className="btn-brand btn fw-semibold"
            style={{ borderRadius: 8 }}
            onClick={handleOpenCreateModal}
          >
            <i className="bi bi-person-plus-fill me-1.5"></i>
            Registrar Personal
          </button>
        }
      />

      {/* Row of 3 StatCards */}
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

      {/* Filter & Search Bar */}
      <SectionCard icon="bi-funnel" title="Filtros y Búsqueda de Personal" className="mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar personal por nombre o correo..."
            />
          </div>
          <div className="col-12 col-md-6 d-flex align-items-center justify-content-md-end gap-2">
            <label className="fs-7 text-muted fw-semibold me-1">Filtrar por Rol:</label>
            <select
              className="form-select form-select-sm w-auto fw-semibold"
              style={{ borderRadius: 8 }}
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
            >
              <option value="todos">Todos los Roles</option>
              <option value="Administrador">Administrador</option>
              <option value="Mesero">Mesero</option>
              <option value="Cocina">Cocina</option>
            </select>
          </div>
        </div>
      </SectionCard>

      {/* Users Data Table (RF-07) */}
      <SectionCard icon="bi-list-ul" title="Listado de Cuentas del Equipo" noPadding>
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <EmptyState
                        title="No se encontraron usuarios"
                        description="Intenta cambiar los filtros de búsqueda o registra un nuevo usuario."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className="rounded-circle fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: 38,
                              height: 38,
                              background: user.role === 'Administrador' ? 'var(--color-brand-light)' : user.role === 'Mesero' ? 'var(--color-emerald-bg)' : 'var(--color-amber-bg)',
                              color: user.role === 'Administrador' ? 'var(--color-brand)' : user.role === 'Mesero' ? 'var(--color-emerald)' : 'var(--color-amber)',
                              fontSize: '0.9rem',
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
                        <Badge
                          status={user.role}
                          variant={
                            user.role === 'Administrador' ? 'primary' : user.role === 'Mesero' ? 'success' : 'warning'
                          }
                        />
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
                            className="btn-icon btn-icon-primary"
                            title="Editar datos"
                            onClick={() => handleOpenEditModal(user)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            className="btn-icon"
                            title="Restablecer Contraseña"
                            onClick={() => resetUserPassword(user.id)}
                          >
                            <i className="bi bi-key-fill"></i>
                          </button>
                          <button
                            className={`btn-icon ${user.active ? 'btn-icon-danger' : 'btn-icon-success'}`}
                            title={user.active ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                            onClick={() => setConfirmUser(user)}
                          >
                            <i className={`bi ${user.active ? 'bi-person-slash' : 'bi-person-check-fill'}`}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>

      {/* Modal Form (RF-01, RF-02) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Editar Datos de Personal' : 'Registrar Nuevo Personal'}
        subtitle="Asigna identidad y rol propio a los miembros del equipo."
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Nombre Completo *</label>
            <input
              type="text"
              className="form-control"
              style={{ borderRadius: 8 }}
              placeholder="Ej. Roberto Sánchez"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Correo Electrónico *</label>
            <input
              type="email"
              className="form-control"
              style={{ borderRadius: 8 }}
              placeholder="ejemplo@gourmetos.com"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Teléfono de Contacto</label>
            <input
              type="text"
              className="form-control"
              style={{ borderRadius: 8 }}
              placeholder="+51 999 888 777"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Rol Asignado *</label>
            <select
              className="form-select"
              style={{ borderRadius: 8 }}
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
            >
              <option value="Mesero">Mesero (Atención en Sala y Cobro)</option>
              <option value="Cocina">Cocina (KDS y Preparación)</option>
              <option value="Administrador">Administrador (Acceso Total)</option>
            </select>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }}>
              {editingUser ? 'Guardar Cambios' : 'Registrar Cuenta'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Account Status Toggle */}
      {confirmUser && (
        <ConfirmModal
          isOpen={!!confirmUser}
          onClose={() => setConfirmUser(null)}
          onConfirm={() => toggleUserStatus(confirmUser.id)}
          title={confirmUser.active ? 'Desactivar Cuenta de Personal' : 'Activar Cuenta de Personal'}
          message={`¿Está seguro de que desea ${confirmUser.active ? 'desactivar' : 'activar'} la cuenta de ${confirmUser.name}? La cuenta no se eliminará físicamente manteniendo el historial.`}
          variant={confirmUser.active ? 'danger' : 'primary'}
          confirmText={confirmUser.active ? 'Desactivar' : 'Activar'}
        />
      )}
    </div>
  );
};

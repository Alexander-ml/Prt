import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { UserAccount, UserRole } from '../types';
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

  return (
    <div className="container-fluid p-0">
      {/* Title & Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold text-dark mb-1">
            <i className="bi bi-people-fill text-primary me-2"></i>
            Gestión de Usuarios y Personal
          </h4>
          <p className="text-muted fs-7 mb-0">
            Administra las cuentas del personal del restaurante (Administrador, Mesero, Cocina) y sus accesos (RF-01 - RF-07).
          </p>
        </div>
        <button className="btn btn-brand btn-md fw-semibold shadow-sm" onClick={handleOpenCreateModal}>
          <i className="bi bi-person-plus-fill me-1.5"></i> Registrar Personal
        </button>
      </div>

      {/* Filter & Search Bar Card */}
      <div className="card glass-card border-0 mb-4 p-3">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar personal por nombre o correo (RF-05)..."
            />
          </div>
          <div className="col-12 col-md-6 d-flex align-items-center justify-content-md-end gap-2">
            <label className="fs-7 text-muted fw-semibold me-1">Filtrar por Rol (RF-06):</label>
            <select
              className="form-select form-select-sm w-auto rounded-3 border-secondary-subtle fw-medium shadow-none"
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
      </div>

      {/* Users Data Table (RF-07) */}
      <div className="custom-table-container">
        <table className="custom-table">
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
                        className="rounded-circle bg-primary bg-opacity-10 text-primary fw-bold d-flex align-items-center justify-content-center"
                        style={{ width: 38, height: 38 }}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="fw-bold text-dark">{user.name}</div>
                        <small className="text-muted">{user.email}</small>
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
                    <span className="text-muted fs-7">{user.phone || 'No registrado'}</span>
                  </td>
                  <td>
                    <Badge
                      status={user.active ? 'Activa' : 'Desactivada'}
                      variant={user.active ? 'success' : 'secondary'}
                    />
                  </td>
                  <td>
                    <span className="text-muted fs-7">{user.lastLogin || 'Nunca'}</span>
                  </td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-1">
                      <button
                        className="btn btn-sm btn-light text-primary border"
                        title="Editar datos (RF-02)"
                        onClick={() => handleOpenEditModal(user)}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-light text-warning-emphasis border"
                        title="Restablecer Contraseña (RF-03)"
                        onClick={() => resetUserPassword(user.id)}
                      >
                        <i className="bi bi-key-fill"></i>
                      </button>
                      <button
                        className={`btn btn-sm ${user.active ? 'btn-light text-danger' : 'btn-light text-success'} border`}
                        title={user.active ? 'Desactivar Cuenta (RF-04)' : 'Activar Cuenta'}
                        onClick={() => setConfirmUser(user)}
                      >
                        <i className={`bi ${user.active ? 'bi-person-x-fill' : 'bi-person-check-fill'}`}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form (RF-01, RF-02) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Editar Datos de Personal (RF-02)' : 'Registrar Nuevo Personal (RF-01)'}
        subtitle="Asigna identidad y rol propio a los miembros del equipo."
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fs-7 fw-semibold text-dark">Nombre Completo *</label>
            <input
              type="text"
              className="form-control rounded-3"
              placeholder="Ej. Roberto Sánchez"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fs-7 fw-semibold text-dark">Correo Electrónico *</label>
            <input
              type="email"
              className="form-control rounded-3"
              placeholder="ejemplo@gourmetos.com"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fs-7 fw-semibold text-dark">Teléfono de Contacto</label>
            <input
              type="text"
              className="form-control rounded-3"
              placeholder="+51 999 888 777"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="mb-4">
            <label className="form-label fs-7 fw-semibold text-dark">Rol Asignado *</label>
            <select
              className="form-select rounded-3"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
            >
              <option value="Mesero">Mesero (Atención en Sala y Cobro)</option>
              <option value="Cocina">Cocina (KDS y Preparación)</option>
              <option value="Administrador">Administrador (Acceso Total)</option>
            </select>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-light fw-medium" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-brand fw-semibold">
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

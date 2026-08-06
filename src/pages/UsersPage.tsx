import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { UserAccount, UserRole } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { EmptyState } from '../components/common/EmptyState';
import { UsersStatsRow } from '../components/users/UsersStatsRow';
import { UsersFilterBar } from '../components/users/UsersFilterBar';
import { UserTable } from '../components/users/UserTable';
import { UserFormModal, type UserFormData } from '../components/users/UserFormModal';

const EMPTY_USER_FORM: UserFormData = { name: '', email: '', phone: '', role: 'Mesero' as UserRole };

/**
 * UsersPage — Personal y Usuarios (RF-01 a RF-07).
 *
 * Orquestador delgado: la presentación de cada rol vive en `userRoleMeta.ts`
 * y cada pieza de UI (stats, filtro, tabla, formulario) en su propio
 * componente bajo `components/users/`. Esta página solo retiene el estado
 * de búsqueda/filtro y de modales, porque `UsersFilterBar` y `UserTable`
 * comparten un mismo dominio (una sola lista de usuarios filtrada) — mismo
 * criterio que `OrdersStatsRow` frente a `OrdersPage`.
 */
export const UsersPage: React.FC = () => {
  const { users, addUser, updateUser, toggleUserStatus, resetUserPassword, currentRole } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('todos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [formData, setFormData] = useState<UserFormData>(EMPTY_USER_FORM);

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
    setFormData(EMPTY_USER_FORM);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, phone: user.phone || '', role: user.role });
    setIsModalOpen(true);
  };

  const handleFormChange = (patch: Partial<UserFormData>) => {
    setFormData(prev => ({ ...prev, ...patch }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (editingUser) {
      updateUser(editingUser.id, formData);
    } else {
      addUser({ ...formData, active: true });
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
      <PageHeader
        icon="bi-people-fill"
        title="Personal y Usuarios"
        subtitle="Alta, edición, activación y control de acceso del personal del restaurante."
        actions={
          <button className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }} onClick={handleOpenCreateModal}>
            <i className="bi bi-person-plus-fill me-2"></i>
            Registrar Personal
          </button>
        }
      />

      <UsersStatsRow />

      <UsersFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
      />

      <SectionCard icon="bi-list-ul" title="Listado de Cuentas del Equipo" noPadding>
        <UserTable
          users={filteredUsers}
          onEdit={handleOpenEditModal}
          onResetPassword={(user) => resetUserPassword(user.id)}
          onRequestStatusToggle={setConfirmUser}
        />
      </SectionCard>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        isEditing={!!editingUser}
        formData={formData}
        onChange={handleFormChange}
      />

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
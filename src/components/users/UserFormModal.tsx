import React from 'react';
import type { UserRole } from '../../types';
import { Modal } from '../common/Modal';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';
import { ROLE_FORM_OPTIONS } from './userRoleMeta';

/** Forma controlada del formulario de personal. La dueña del estado es `UsersPage`. */
export interface UserFormData {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  formData: UserFormData;
  onChange: (patch: Partial<UserFormData>) => void;
}

/**
 * UserFormModal — Modal de alta/edición de personal (RF-01, RF-02).
 * Componente controlado, sin estado propio: refleja `formData` y reporta
 * cambios hacia `UsersPage`, que es quien conoce `addUser`/`updateUser`
 * del AppContext — mismo patrón que `CategoryFormModal`.
 *
 * El select de rol sale de `ROLE_FORM_OPTIONS` (userRoleMeta.ts), con la
 * descripción de cada rol incluida — agregar un rol nuevo no requiere
 * tocar este componente.
 */
export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  formData,
  onChange,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Datos de Personal' : 'Registrar Nuevo Personal'}
      subtitle="Asigna identidad y rol propio a los miembros del equipo."
    >
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="userNameInput" className="form-label">Nombre Completo *</label>
          <input
            id="userNameInput"
            type="text"
            className="form-control"
            style={{ borderRadius: 8 }}
            placeholder="Ej. Roberto Sánchez"
            required
            value={formData.name}
            onChange={e => onChange({ name: e.target.value })}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="userEmailInput" className="form-label">Correo Electrónico *</label>
          <input
            id="userEmailInput"
            type="email"
            className="form-control"
            style={{ borderRadius: 8 }}
            placeholder="ejemplo@gourmetos.com"
            required
            value={formData.email}
            onChange={e => onChange({ email: e.target.value })}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="userPhoneInput" className="form-label">Teléfono de Contacto</label>
          <input
            id="userPhoneInput"
            type="text"
            className="form-control"
            style={{ borderRadius: 8 }}
            placeholder="+51 999 888 777"
            value={formData.phone}
            onChange={e => onChange({ phone: e.target.value })}
          />
        </div>

        <div className="mb-4">
          <label id="rolAsignadoLabel" className="form-label">Rol Asignado *</label>
          <CustomDropdownSelect
            id="rolAsignadoSelect"
            labelId="rolAsignadoLabel"
            value={formData.role}
            onChange={(v) => onChange({ role: v as UserRole })}
            required
            options={ROLE_FORM_OPTIONS}
          />
        </div>

        <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
          <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }}>
            {isEditing ? 'Guardar Cambios' : 'Registrar Cuenta'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
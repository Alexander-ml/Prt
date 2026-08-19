import React, { useRef } from 'react';
import type { LedgerCategory } from '../../types';
import { Modal } from '../common/Modal';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';

export interface LedgerEntryFormData {
  type: 'ingreso' | 'egreso';
  categoryId: string;
  description: string;
  amount: number;
  reference: string;
  date: string;
}

interface LedgerEntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: LedgerEntryFormData;
  onChange: (patch: Partial<LedgerEntryFormData>) => void;
  ledgerCategories: LedgerCategory[];
  editingEntryId?: string | null;
}

export const LedgerEntryFormModal: React.FC<LedgerEntryFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  ledgerCategories,
  editingEntryId,
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  const categoryOptions = ledgerCategories
    .filter(cat => cat.kind === formData.type || cat.kind === 'ambos')
    .map(cat => ({
      value: cat.id,
      label: cat.name,
      icon: 'bi-tag-fill',
      colorVariant: formData.type === 'ingreso' ? 'success' : 'danger',
    }));

  const handleTypeChange = (type: 'ingreso' | 'egreso') => {
    const firstValid = ledgerCategories.find(cat => cat.kind === type || cat.kind === 'ambos');
    onChange({ type, categoryId: firstValid?.id ?? '' });
  };

  const footerButtons = (
    <div className="d-flex justify-content-end gap-2 w-100">
      <button type="button" className="btn btn-outline-secondary rounded-3" onClick={onClose}>
        Cancelar
      </button>
      <button
        type="button"
        className="btn-brand btn fw-semibold rounded-3"
        disabled={!formData.categoryId}
        onClick={() => formRef.current?.requestSubmit()}
      >
        <i className={`bi ${editingEntryId ? 'bi-check2-lg' : 'bi-plus-lg'} me-1`}></i>
        {editingEntryId ? 'Guardar Cambios' : 'Registrar Asiento'}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingEntryId ? 'Editar Asiento Contable' : 'Registrar Asiento Contable'}
      subtitle={editingEntryId ? 'Modifique los campos y registre el motivo del cambio.' : 'Registre un ingreso o egreso manual en el libro diario.'}
      footer={footerButtons}
    >
      <form ref={formRef} onSubmit={onSubmit}>
        <div className="mb-3">
          <label className="form-label">Fecha del Asiento *</label>
          <input
            type="date"
            className="form-control rounded-3"
            required
            value={formData.date}
            onChange={e => onChange({ date: e.target.value })}
          />
        </div>

        <div className="mb-3">
          <label className="form-label d-block">Tipo de Registro *</label>
          <div className="d-flex gap-2">
            <button
              type="button"
              className={`btn flex-grow-1 fw-semibold ${formData.type === 'ingreso' ? 'btn-success' : 'btn-outline-success'} rounded-3`}
              onClick={() => handleTypeChange('ingreso')}
            >
              <i className="bi bi-arrow-down-left-circle me-1"></i> Ingreso
            </button>
            <button
              type="button"
              className={`btn flex-grow-1 fw-semibold ${formData.type === 'egreso' ? 'btn-danger' : 'btn-outline-danger'} rounded-3`}
              onClick={() => handleTypeChange('egreso')}
            >
              <i className="bi bi-arrow-up-right-circle me-1"></i> Egreso
            </button>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label d-block">Categoría *</label>
          <CustomDropdownSelect
            value={formData.categoryId}
            onChange={value => onChange({ categoryId: value })}
            placeholder="Seleccione categoría..."
            options={categoryOptions}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Descripción *</label>
          <input
            type="text"
            className="form-control rounded-3"
            placeholder="Ej. Pago factura de verduras frescas"
            required
            value={formData.description}
            onChange={e => onChange({ description: e.target.value })}
          />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-6">
            <label className="form-label">Monto (S/) *</label>
            <div className="input-group">
              <span className="input-group-text rounded-start-3">S/</span>
              <input
                type="number"
                step="0.5"
                min="0.1"
                className="form-control rounded-end-3"
                required
                value={formData.amount}
                onChange={e => onChange({ amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="col-6">
            <label className="form-label">Referencia / Comprobante</label>
            <input
              type="text"
              className="form-control rounded-3"
              placeholder="Ej. FAC-0001"
              value={formData.reference}
              onChange={e => onChange({ reference: e.target.value })}
            />
          </div>
        </div>

        {editingEntryId && (
          <div>
            <label className="form-label">Motivo de Edición *</label>
            <input
              type="text"
              className="form-control rounded-3"
              placeholder="Ej. Corrección de monto por error de digitación"
              required
              id="editReason"
            />
            <div className="form-text">Este motivo quedará registrado en el historial del asiento.</div>
          </div>
        )}
      </form>
    </Modal>
  );
};

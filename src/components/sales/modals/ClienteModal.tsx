import React, { useState, useEffect } from 'react';
import type { Cliente, TipoDocumentoCliente } from '../../../types';
import { Modal } from '../../common/Modal';

/* ─────────────────────────────────────────────────────────────
   ClienteModal — Alta rápida de cliente para Boleta/Factura
   (punto #13 del análisis UX).
   ───────────────────────────────────────────────────────────── */
interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTipoDocumento?: TipoDocumentoCliente;
  onSave: (data: Omit<Cliente, 'id'>) => void;
}

export const ClienteModal: React.FC<ClienteModalProps> = ({ isOpen, onClose, defaultTipoDocumento = 'DNI', onSave }) => {
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoCliente>(defaultTipoDocumento);
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [nombreORazonSocial, setNombreORazonSocial] = useState('');
  const [direccion, setDireccion] = useState('');
  const [correo, setCorreo] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTipoDocumento(defaultTipoDocumento);
      setNumeroDocumento('');
      setNombreORazonSocial('');
      setDireccion('');
      setCorreo('');
    }
  }, [isOpen, defaultTipoDocumento]);

  const expectedLength = tipoDocumento === 'RUC' ? 11 : 8;
  const isValid =
    numeroDocumento.trim().length === expectedLength &&
    /^\d+$/.test(numeroDocumento.trim()) &&
    nombreORazonSocial.trim().length > 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      tipoDocumento,
      numeroDocumento: numeroDocumento.trim(),
      nombreORazonSocial: nombreORazonSocial.trim(),
      direccion: direccion.trim() || undefined,
      correo: correo.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Cliente" size="sm">
      <div className="mb-3">
        <label className="form-label fw-bold">Tipo de Documento</label>
        <div className="d-flex gap-2">
          {(['DNI', 'RUC'] as TipoDocumentoCliente[]).map(t => (
            <button
              key={t}
              type="button"
              className={`btn flex-fill fw-semibold ${tipoDocumento === t ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
              style={{ borderRadius: 8, minHeight: 40 }}
              onClick={() => { setTipoDocumento(t); setNumeroDocumento(''); }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="clienteNumDoc">{tipoDocumento === 'RUC' ? 'RUC (11 dígitos)' : 'DNI (8 dígitos)'}</label>
        <input
          id="clienteNumDoc"
          type="text"
          inputMode="numeric"
          className="form-control"
          style={{ borderRadius: 8 }}
          maxLength={expectedLength}
          value={numeroDocumento}
          onChange={e => setNumeroDocumento(e.target.value.replace(/\D/g, ''))}
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="clienteNombre">{tipoDocumento === 'RUC' ? 'Razón Social' : 'Nombre Completo'}</label>
        <input
          id="clienteNombre"
          type="text"
          className="form-control"
          style={{ borderRadius: 8 }}
          value={nombreORazonSocial}
          onChange={e => setNombreORazonSocial(e.target.value)}
        />
      </div>
      {tipoDocumento === 'RUC' && (
        <div className="mb-3">
          <label className="form-label" htmlFor="clienteDireccion">Dirección Fiscal</label>
          <input
            id="clienteDireccion"
            type="text"
            className="form-control"
            style={{ borderRadius: 8 }}
            value={direccion}
            onChange={e => setDireccion(e.target.value)}
          />
        </div>
      )}
      <div className="mb-3">
        <label className="form-label" htmlFor="clienteCorreo">Correo (opcional)</label>
        <input
          id="clienteCorreo"
          type="email"
          className="form-control"
          style={{ borderRadius: 8 }}
          value={correo}
          onChange={e => setCorreo(e.target.value)}
        />
      </div>
      <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }} disabled={!isValid} onClick={handleSave}>
          <i className="bi bi-check-lg me-1"></i>Guardar Cliente
        </button>
      </div>
    </Modal>
  );
};

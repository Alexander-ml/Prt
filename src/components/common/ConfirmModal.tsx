import React from 'react';
import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="d-flex justify-content-end gap-2 w-100">
          <button type="button" className="btn btn-light fw-medium" onClick={onClose}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn btn-${variant} fw-semibold`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <div className="text-center py-2">
        <i
          className={`bi bi-exclamation-circle text-${variant} display-4 mb-3 d-inline-block`}
        ></i>
        <p className="text-muted fs-6 mb-0">{message}</p>
      </div>
    </Modal>
  );
};

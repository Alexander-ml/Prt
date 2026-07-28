import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  let modalWidthClass = 'modal-md';
  if (size === 'sm') modalWidthClass = 'modal-sm';
  if (size === 'lg') modalWidthClass = 'modal-lg';
  if (size === 'xl') modalWidthClass = 'modal-xl';

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
    >
      <div className={`modal-dialog ${modalWidthClass} modal-dialog-centered modal-dialog-scrollable`}>
        <div className="modal-content modal-content-custom border-0 shadow-lg">
          <div className="modal-header border-bottom px-4 py-3 bg-light">
            <div>
              <h5 className="modal-title fw-bold text-dark mb-0">{title}</h5>
              {subtitle && <small className="text-muted">{subtitle}</small>}
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Cerrar"
            ></button>
          </div>
          <div className="modal-body p-4">{children}</div>
          {footer && <div className="modal-footer border-top bg-light px-4 py-3">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

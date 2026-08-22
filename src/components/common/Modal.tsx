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

/**
 * Modal — Diálogo modal estándar del sistema.
 *
 * Nota sobre overflow: NO se usa la clase `.modal-dialog-scrollable` de
 * Bootstrap porque esta fuerza `overflow: hidden` en `.modal-content`,
 * lo que recorta cualquier panel flotante (CustomDropdownSelect, etc.)
 * que un formulario abra dentro del modal. En su lugar, el scroll
 * interno se aplica manualmente solo sobre `.modal-body` vía
 * `max-height` + `overflow-y: auto`, dejando el resto del árbol con
 * overflow visible para que los dropdowns puedan desplegarse sin
 * cortarse.
 */
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitleHeading"
      onMouseDown={e => {
        // Cerrar al hacer clic en el backdrop (fuera del modal-dialog)
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
    >
      <div className={`modal-dialog ${modalWidthClass} modal-dialog-centered`}>
        <div
          className="modal-content modal-content-custom border-0 shadow-lg"
          style={{ maxHeight: 'calc(100vh - 3.5rem)' }}
        >
          <div className="modal-header border-bottom px-4 py-3 bg-light flex-shrink-0">
            <div className="text-truncate">
              <h5 id="modalTitleHeading" className="modal-title fw-bold text-dark mb-0 text-truncate">
                {title}
              </h5>
              {subtitle && <small className="text-muted">{subtitle}</small>}
            </div>
            <button
              type="button"
              className="btn-close flex-shrink-0"
              onClick={onClose}
              aria-label="Cerrar"
            ></button>
          </div>

          <div
            className="modal-body p-4"
            style={{ overflowY: 'auto', overflowX: 'visible' }}
          >
            {children}
          </div>

          {footer && (
            <div className="modal-footer border-top bg-light px-4 py-3 flex-shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

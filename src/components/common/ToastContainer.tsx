import React from 'react';
import { useApp } from '../../context/AppContext';

const ICONS: Record<string, string> = {
  success: 'bi-check-circle-fill',
  danger:  'bi-x-circle-fill',
  warning: 'bi-exclamation-triangle-fill',
  info:    'bi-info-circle-fill',
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-wrapper" role="region" aria-live="polite" aria-label="Notificaciones">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type}`}
          role="alert"
        >
          <div className="toast-item-icon">
            <i className={`bi ${ICONS[toast.type] || ICONS.info}`}></i>
          </div>
          <div className="flex-grow-1 min-w-0">
            <div className="fw-bold text-dark" style={{ fontSize: '0.875rem', lineHeight: 1.3 }}>
              {toast.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem', lineHeight: 1.4 }}>
              {toast.message}
            </div>
          </div>
          <button
            className="btn-close flex-shrink-0"
            style={{ fontSize: '0.7rem', opacity: 0.6 }}
            onClick={() => removeToast(toast.id)}
            aria-label="Cerrar notificación"
          />
        </div>
      ))}
    </div>
  );
};

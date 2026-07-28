import React from 'react';

interface PageHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: { text: string; variant: string };
}

/**
 * PageHeader — Encabezado estándar para todos los módulos.
 * Elimina el patrón repetido (h4 + subtítulo + botones) en cada página.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  title,
  subtitle,
  actions,
  badge,
}) => {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-header-title">
          <i className={`bi ${icon}`}></i>
          {title}
          {badge && (
            <span className={`badge bg-${badge.variant}-subtle text-${badge.variant} border border-${badge.variant}-subtle rounded-pill ms-2`}
              style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.65rem' }}>
              {badge.text}
            </span>
          )}
        </h1>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      {actions && (
        <div className="page-header-actions">{actions}</div>
      )}
    </div>
  );
};

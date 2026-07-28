import React from 'react';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}

/**
 * SectionCard — Card contenedora estándar para secciones de contenido.
 * Reemplaza las tarjetas con estilos manuales inconsistentes.
 */
export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  icon,
  actions,
  children,
  className = '',
  bodyClassName = '',
  noPadding = false,
}) => {
  const hasHeader = title || icon || actions;

  return (
    <div className={`section-card ${className}`}>
      {hasHeader && (
        <div className="section-card-header">
          <div className="flex-grow-1 min-w-0">
            {(title || icon) && (
              <h2 className="section-card-title">
                {icon && <i className={`bi ${icon}`}></i>}
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={noPadding ? '' : `section-card-body ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

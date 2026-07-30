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
 *
 * Nota: se fuerza `overflow-visible` en el contenedor y en el body para
 * que los paneles flotantes (CustomDropdownSelect, tooltips, etc.) no
 * queden recortados por el `overflow: hidden` que .section-card aplica
 * a nivel de estilos globales (necesario para bordes redondeados en
 * imágenes/tablas). Si dentro de la card necesitas scroll horizontal
 * (ej. una tabla ancha), maneja ese overflow en un wrapper interno
 * propio (como .table-responsive), no en SectionCard.
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
    <div className={`section-card overflow-visible ${className}`}>
      {hasHeader && (
        <div className="section-card-header overflow-visible">
          <div className="flex-grow-1 min-w-0">
            {(title || icon) && (
              <h2 className="section-card-title">
                {icon && <i className={`bi ${icon}`} aria-hidden="true"></i>}
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mb-0 mt-1 small text-muted">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="d-flex align-items-center gap-2 flex-shrink-0 overflow-visible">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={`overflow-visible ${noPadding ? '' : `section-card-body ${bodyClassName}`}`}>
        {children}
      </div>
    </div>
  );
};
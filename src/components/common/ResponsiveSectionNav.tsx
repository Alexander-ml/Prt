import React from 'react';

export interface ResponsiveSectionNavItem {
  value: string;
  label: string;
  icon?: string;
}

interface ResponsiveSectionNavProps {
  items: ResponsiveSectionNavItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  /**
   * `auto` conserva tabs para una o dos opciones y usa selector móvil para
   * tres o más. Permite que un módulo con tres opciones fuerce tabs cuando
   * sus etiquetas realmente caben, sin duplicar la lógica en cada página.
   */
  mobileMode?: 'auto' | 'tabs' | 'select';
}

/**
 * Navegación interna de módulo, preparada para crecer sin comprometer el
 * espacio táctil en móvil. En escritorio siempre expone las secciones como
 * tabs; en móvil solo colapsa cuando la cantidad de opciones lo justifica.
 */
export const ResponsiveSectionNav: React.FC<ResponsiveSectionNavProps> = ({
  items,
  value,
  onChange,
  ariaLabel,
  mobileMode = 'auto',
}) => {
  const useMobileSelect = mobileMode === 'select' || (mobileMode === 'auto' && items.length > 2);
  const selectedItem = items.find(item => item.value === value) ?? items[0];

  return (
    <div className={`responsive-section-nav ${useMobileSelect ? 'has-mobile-select' : 'has-mobile-tabs'}`}>
      <div className="responsive-section-nav-tabs" role="tablist" aria-label={ariaLabel}>
        {items.map(item => {
          const isActive = item.value === value;
          return (
            <button
              type="button"
              key={item.value}
              role="tab"
              aria-selected={isActive}
              className={`responsive-section-nav-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => onChange(item.value)}
            >
              {item.icon && <i className={`bi ${item.icon}`} aria-hidden="true"></i>}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {useMobileSelect && selectedItem && (
        <label className="responsive-section-nav-select">
          <span className="visually-hidden">{ariaLabel}</span>
          <i className={`bi ${selectedItem.icon ?? 'bi-list'}`} aria-hidden="true"></i>
          <select value={value} onChange={event => onChange(event.target.value)}>
            {items.map(item => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <i className="bi bi-chevron-down" aria-hidden="true"></i>
        </label>
      )}
    </div>
  );
};

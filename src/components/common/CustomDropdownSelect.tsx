import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  colorVariant?: string;
  disabled?: boolean;
}

export interface DropdownGroup {
  label: string;
  icon?: string;
  options: DropdownOption[];
}

interface CustomDropdownSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options?: DropdownOption[];
  groups?: DropdownGroup[];
  disabled?: boolean;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  labelId?: string;
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  success:   { bg: '#d1e7dd', text: '#0a3622', border: '#a3cfbb', dot: '#198754' },
  danger:    { bg: '#f8d7da', text: '#58151c', border: '#f1aeb5', dot: '#dc3545' },
  warning:   { bg: '#fff3cd', text: '#664d03', border: '#ffe69c', dot: '#f59e0b' },
  info:      { bg: '#cff4fc', text: '#055160', border: '#9eeaf9', dot: '#0dcaf0' },
  primary:   { bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe', dot: '#4f46e5' },
  secondary: { bg: '#e9ecef', text: '#343a40', border: '#ced4da', dot: '#6c757d' },
  violet:    { bg: '#ede9fe', text: '#4c1d95', border: '#c4b5fd', dot: '#7c3aed' },
  amber:     { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', dot: '#d97706' },
  sky:       { bg: '#e0f2fe', text: '#075985', border: '#7dd3fc', dot: '#0284c7' },
  rose:      { bg: '#ffe4e6', text: '#9f1239', border: '#fda4af', dot: '#e11d48' },
  emerald:   { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7', dot: '#059669' },
};

function getColors(colorVariant?: string) {
  if (!colorVariant) return null;
  return COLOR_MAP[colorVariant] ?? null;
}

const PANEL_MAX_HEIGHT = 280;
const PANEL_GAP = 4;

/**
 * CustomDropdownSelect — Select enriquecido con color/ícono por opción.
 *
 * El panel de opciones se renderiza vía Portal directo a `document.body`,
 * posicionado con `position: fixed` en base al rect real del trigger.
 * Esto evita que quede recortado por cualquier ancestro con overflow
 * controlado (Modal, SectionCard, tablas con scroll horizontal, etc.) y
 * garantiza que siempre se muestre por encima de todo (z-index alto),
 * incluido el backdrop del Modal. Se reposiciona en scroll/resize
 * mientras está abierto para seguir anclado visualmente al trigger.
 */
export const CustomDropdownSelect: React.FC<CustomDropdownSelectProps> = ({
  id,
  value,
  onChange,
  placeholder = 'Seleccione una opción...',
  options,
  groups,
  disabled = false,
  required = false,
  size = 'md',
  className = '',
  labelId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [panelPos, setPanelPos] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);

  const allOptions: DropdownOption[] = options
    ? options
    : (groups ?? []).flatMap(g => g.options);
  const enabledOptions = allOptions.filter(o => !o.disabled);
  const selectedOption = allOptions.find(o => o.value === value) ?? null;

  // Calcula la posición del panel en función del trigger, decidiendo si
  // abre hacia abajo o hacia arriba según el espacio disponible en viewport.
  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < PANEL_MAX_HEIGHT && spaceAbove > spaceBelow;

    setPanelPos({
      left: rect.left,
      width: rect.width,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + PANEL_GAP }
        : { top: rect.bottom + PANEL_GAP }),
    });
  }, []);

  // Posiciona antes de pintar al abrir (evita parpadeo)
  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  // Reposiciona mientras está abierto si la página o un contenedor scrollea,
  // o si cambia el tamaño de ventana. `capture: true` permite detectar
  // scroll de cualquier contenedor ancestro (ej. modal-body), no solo window.
  useEffect(() => {
    if (!isOpen) return;
    const handleReposition = () => updatePosition();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, updatePosition]);

  // Cierre al hacer clic fuera: revisa tanto el trigger como el panel
  // portaleado, ya que este último ya no es descendiente del trigger en el DOM.
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || focusedIndex < 0) return;
    const items = panelRef.current?.querySelectorAll<HTMLLIElement>('[role="option"]');
    items?.[focusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex, isOpen]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen(prev => {
      if (!prev) {
        const idx = enabledOptions.findIndex(o => o.value === value);
        setFocusedIndex(idx >= 0 ? idx : 0);
      }
      return !prev;
    });
  }, [disabled, enabledOptions, value]);

  const handleSelect = useCallback((opt: DropdownOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && focusedIndex < enabledOptions.length) {
          handleSelect(enabledOptions[focusedIndex]);
        } else {
          setIsOpen(true);
          const idx = enabledOptions.findIndex(o => o.value === value);
          setFocusedIndex(idx >= 0 ? idx : 0);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) { setIsOpen(true); setFocusedIndex(0); }
        else setFocusedIndex(prev => Math.min(prev + 1, enabledOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) { setIsOpen(true); setFocusedIndex(enabledOptions.length - 1); }
        else setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  }, [disabled, isOpen, focusedIndex, enabledOptions, handleSelect, value]);

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { fontSize: '0.8125rem', padding: '0.3rem 0.65rem',    minHeight: 32 },
    md: { fontSize: '0.875rem',  padding: '0.45rem 0.875rem',  minHeight: 38 },
    lg: { fontSize: '1rem',      padding: '0.6rem 1rem',       minHeight: 48 },
  };

  const triggerColors = selectedOption ? getColors(selectedOption.colorVariant) : null;
  const triggerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    width: '100%',
    border: `1px solid ${triggerColors ? triggerColors.border : '#dee2e6'}`,
    borderRadius: 8,
    background: triggerColors ? triggerColors.bg : '#fff',
    color: triggerColors ? triggerColors.text : '#212529',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.65 : 1,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    outline: 'none',
    textAlign: 'left' as const,
    ...sizeStyles[size],
  };

  const renderOption = (opt: DropdownOption, enabledIdx: number) => {
    const colors = getColors(opt.colorVariant);
    const isSelected = opt.value === value;
    const isFocused = enabledOptions[focusedIndex]?.value === opt.value;
    const optStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.6rem',
      padding: '0.5rem 0.875rem',
      cursor: opt.disabled ? 'not-allowed' : 'pointer',
      opacity: opt.disabled ? 0.5 : 1,
      background: isFocused || isSelected
        ? (colors ? colors.bg : (isFocused ? '#f8f9fa' : '#eef2ff'))
        : 'transparent',
      color: colors ? colors.text : '#212529',
      transition: 'background 0.1s ease',
      fontSize: sizeStyles[size].fontSize,
      borderRadius: 6,
      margin: '0 0.25rem',
    };
    return (
      <li
        key={opt.value}
        role="option"
        aria-selected={isSelected}
        aria-disabled={opt.disabled}
        style={optStyle}
        onClick={() => !opt.disabled && handleSelect(opt)}
        onMouseEnter={() => setFocusedIndex(enabledIdx)}
      >
        {opt.colorVariant && colors && (
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors.dot, flexShrink: 0, marginTop: 4 }} />
        )}
        {opt.icon && (
          <i className={`bi ${opt.icon}`} style={{ fontSize: '0.95rem', flexShrink: 0 }} />
        )}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: isSelected ? 700 : 500, display: 'block' }}>{opt.label}</span>
          {opt.description && (
            <span style={{ fontSize: '0.75rem', opacity: 0.75, display: 'block', marginTop: 1 }}>{opt.description}</span>
          )}
        </span>
        {isSelected && (
          <i className="bi bi-check-lg" style={{ color: colors?.dot ?? '#4f46e5', fontSize: '0.9rem', flexShrink: 0 }} />
        )}
      </li>
    );
  };

  let globalEnabledIdx = -1;

  const panel = isOpen && panelPos && (
    <ul
      ref={panelRef}
      role="listbox"
      aria-labelledby={labelId ?? id}
      style={{
        position: 'fixed',
        top: panelPos.top,
        bottom: panelPos.bottom,
        left: panelPos.left,
        width: panelPos.width,
        zIndex: 1080,
        background: '#fff',
        border: '1px solid #dee2e6',
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
        maxHeight: PANEL_MAX_HEIGHT,
        overflowY: 'auto',
        padding: '0.3rem 0',
        listStyle: 'none',
        margin: 0,
      }}
    >
      {options && options.map(opt => {
        if (!opt.disabled) globalEnabledIdx++;
        return renderOption(opt, globalEnabledIdx);
      })}
      {groups && groups.map(group => (
        <React.Fragment key={group.label}>
          <li
            role="presentation"
            style={{
              padding: '0.4rem 0.875rem 0.2rem',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: '#6c757d',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderTop: '1px solid #f1f5f9',
              marginTop: '0.25rem',
            }}
          >
            {group.icon && <i className={`bi ${group.icon}`} />}
            {group.label}
            <span style={{ marginLeft: 'auto', background: '#e2e8f0', borderRadius: 99, padding: '0 5px', fontSize: '0.62rem', fontWeight: 700, color: '#475569' }}>
              {group.options.filter(o => !o.disabled).length}
            </span>
          </li>
          {group.options.map(opt => {
            if (!opt.disabled) globalEnabledIdx++;
            return renderOption(opt, globalEnabledIdx);
          })}
        </React.Fragment>
      ))}
    </ul>
  );

  return (
    <div className={className} style={{ width: '100%' }}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={labelId}
        aria-required={required}
        style={triggerStyle}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
          {selectedOption?.colorVariant && (() => {
            const c = getColors(selectedOption.colorVariant);
            return c ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, flexShrink: 0 }} /> : null;
          })()}
          {selectedOption?.icon && <i className={`bi ${selectedOption.icon}`} style={{ flexShrink: 0 }} />}
          <span style={{
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontWeight: selectedOption ? 600 : 400,
            color: selectedOption && triggerColors ? triggerColors.text : '#6c757d',
          }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: '0.7rem', flexShrink: 0 }} />
      </button>

      {typeof document !== 'undefined' && panel && createPortal(panel, document.body)}
    </div>
  );
};
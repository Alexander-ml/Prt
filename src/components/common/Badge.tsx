import React from 'react';

interface BadgeProps {
  status: string;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'secondary' | 'primary' | 'dark';
  icon?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant = 'secondary',
  icon,
  className = '',
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.2rem 0.6rem',
    borderRadius: '9999px',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    border: '1px solid transparent',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    success:   { background: 'var(--color-emerald-bg)', color: 'var(--color-emerald-text)', borderColor: '#6ee7b7' },
    danger:    { background: 'var(--color-rose-bg)',    color: 'var(--color-rose-text)',    borderColor: '#fca5a5' },
    warning:   { background: 'var(--color-amber-bg)',   color: 'var(--color-amber-text)',   borderColor: '#fcd34d' },
    info:      { background: 'var(--color-sky-bg)',     color: 'var(--color-sky-text)',     borderColor: '#7dd3fc' },
    primary:   { background: 'var(--color-brand-light)',color: 'var(--color-brand)',        borderColor: 'var(--color-brand-subtle)' },
    secondary: { background: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' },
    dark:      { background: '#1e293b', color: '#f1f5f9', borderColor: '#334155' },
  };

  return (
    <span
      className={className}
      style={{ ...baseStyle, ...(variantStyles[variant] || variantStyles.secondary) }}
    >
      {icon && <i className={`bi ${icon}`}></i>}
      {status}
    </span>
  );
};

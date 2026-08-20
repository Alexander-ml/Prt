import React from 'react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';

interface TopbarProps {
  onMenuClick: () => void;
}


const ROLE_CONFIG: Record<UserRole, { icon: string; color: string; surface: string; border: string; label: string; userName: string }> = {
  Administrador: { icon: 'bi-shield-lock-fill', color: 'var(--brand-black)', surface: 'var(--brand-black-soft)', border: 'var(--brand-black)', label: 'Administrador', userName: 'Carlos Mendoza' },
  Mesero:        { icon: 'bi-person-walking', color: 'var(--brand-primary)', surface: 'var(--brand-primary-soft)', border: 'var(--brand-primary-subtle)', label: 'Mesero (Sala)', userName: 'Juan Pérez' },
  Cocina:        { icon: 'bi-fire', color: 'var(--brand-yellow-text)', surface: 'var(--brand-yellow-soft)', border: 'var(--brand-yellow)', label: 'Cocina (KDS)', userName: 'Chef Mario' },
};

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { currentRole, setCurrentRole, insumos, orders } = useApp();

  const config = ROLE_CONFIG[currentRole];
  const lowStockCount = insumos.filter(i => i.currentStock <= i.minStock).length;
  const kitchenOrdersCount = orders.filter(o => o.status === 'en_preparacion').length;

  return (
    <header className="app-topbar" role="banner">
      {/* Left: navegación móvil. El branding vive únicamente en Sidebar. */}
      <div className="d-flex align-items-center min-w-0">
        <button
          className="topbar-hamburger"
          onClick={onMenuClick}
          aria-label="Abrir menú de navegación"
          aria-expanded="false"
        >
          <i className="bi bi-list fs-5"></i>
        </button>
      </div>

      {/* Right: Indicators + Role Switcher + User */}
      <div className="d-flex align-items-center gap-2 flex-shrink-0">

        {/* Kitchen indicator */}
        {kitchenOrdersCount > 0 && (
          <div
            className="d-none d-md-flex align-items-center gap-1"
            style={{
              background: 'var(--brand-yellow-soft)', border: '1px solid var(--brand-yellow)',
              color: 'var(--brand-yellow-text)', borderRadius: 99, padding: '0.25rem 0.7rem',
              fontSize: '0.75rem', fontWeight: 700,
            }}
          >
            <i className="bi bi-clock-history" style={{ fontSize: '0.8rem' }}></i>
            {kitchenOrdersCount} en cocina
          </div>
        )}

        {/* Low stock indicator (admin only) */}
        {lowStockCount > 0 && currentRole === 'Administrador' && (
          <div
            className="d-none d-md-flex align-items-center gap-1"
            style={{
              background: 'var(--brand-red-soft)', border: '1px solid var(--brand-red)',
              color: 'var(--brand-red-text)', borderRadius: 99, padding: '0.25rem 0.7rem',
              fontSize: '0.75rem', fontWeight: 700,
            }}
          >
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '0.8rem' }}></i>
            {lowStockCount} bajo stock
          </div>
        )}

        {/* Separator */}
        <div className="d-none d-md-block" style={{ width: 1, height: 28, background: 'var(--border-color)' }}></div>

        {/* Role Switcher Dropdown */}
        <div className="dropdown">
          <button
            className="role-badge-btn dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            aria-label="Cambiar rol de demostración"
          >
            <i className={`bi ${config.icon}`} style={{ color: config.color, fontSize: '0.95rem' }}></i>
            <div className="text-start d-none d-sm-block">
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1 }}>Rol activo</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {config.label}
              </div>
            </div>
          </button>
          <ul
            className="dropdown-menu dropdown-menu-end shadow-lg border-0 py-2"
            style={{ borderRadius: 12, minWidth: 230, marginTop: 8 }}
          >
            <li>
              <div className="px-3 py-1 mb-1" style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Cambiar Rol de Demostración
              </div>
            </li>
            {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([role, cfg]) => (
              <li key={role}>
                <button
                  className={`dropdown-item d-flex align-items-center gap-2 py-2 px-3 ${currentRole === role ? 'active' : ''}`}
                  style={{ borderRadius: 8, margin: '0 4px', width: 'calc(100% - 8px)' }}
                  onClick={() => setCurrentRole(role)}
                >
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: currentRole === role ? cfg.surface : 'var(--surface-muted)',
                      border: `1px solid ${currentRole === role ? cfg.border : 'var(--border-color)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <i
                      className={`bi ${cfg.icon}`}
                      style={{ color: cfg.color, fontSize: '0.95rem' }}
                    ></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.2 }}>{cfg.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1 }}>{cfg.userName}</div>
                  </div>
                  {currentRole === role && (
                    <i className="bi bi-check2 ms-auto" style={{ color: 'var(--brand-primary)' }}></i>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* User Avatar */}
        <div className="d-flex align-items-center gap-2 ps-1">
          <div
            style={{
              width: 36, height: 36, borderRadius: 9999,
              background: config.surface,
              border: `2px solid ${config.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: config.color, fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {config.userName.charAt(0)}
          </div>
          <div className="d-none d-lg-block">
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {config.userName}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
              {config.label}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

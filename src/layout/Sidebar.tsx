import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { RestaurantBrand } from '../components/branding/RestaurantBrand';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  icon: string;
  label: string;
  roles: ('Administrador' | 'Mesero' | 'Cocina')[];
}

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { to: '/', icon: 'bi-grid-1x2-fill', label: 'Panel de Control', roles: ['Administrador', 'Mesero', 'Cocina'] },
    ] as NavItem[],
  },
  {
    label: 'Operación en Sala',
    items: [
      { to: '/mesas',   icon: 'bi-diagram-3-fill', label: 'Áreas y Mesas',      roles: ['Administrador', 'Mesero'] },
      { to: '/pedidos', icon: 'bi-receipt',          label: 'Gestión de Pedidos', roles: ['Administrador', 'Mesero'] },
      { to: '/ventas',  icon: 'bi-cash-coin',         label: 'Ventas y Cobro',    roles: ['Administrador', 'Mesero'] },
    ] as NavItem[],
  },
  {
    label: 'Cocina & Menú',
    items: [
      { to: '/cocina',   icon: 'bi-display-fill', label: 'Cocina KDS',        roles: ['Administrador', 'Mesero', 'Cocina'] },
      { to: '/catalogo', icon: 'bi-book-half',    label: 'Catálogo de Platos', roles: ['Administrador', 'Mesero'] },
    ] as NavItem[],
  },
  {
    label: 'Administración',
    items: [
      { to: '/usuarios',      icon: 'bi-people-fill',    label: 'Personal y Usuarios',   roles: ['Administrador'] },
      { to: '/configuracion', icon: 'bi-sliders',         label: 'Configuración General', roles: ['Administrador'] },
    ] as NavItem[],
  },
  {
    label: 'Gestión Avanzada',
    items: [
      { to: '/inventario',   icon: 'bi-boxes',        label: 'Inventario e Insumos', roles: ['Administrador'] },
      { to: '/contabilidad', icon: 'bi-journal-text', label: 'Contabilidad Formal',  roles: ['Administrador'] },
    ] as NavItem[],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentRole, restaurantInfo } = useApp();
  const navigate = useNavigate();

  const handleLinkClick = () => {
    // Close sidebar on mobile when navigating
    if (window.innerWidth < 768) onClose();
  };

  return (
    <aside
      className={`app-sidebar ${isOpen ? 'sidebar-open' : ''}`}
      aria-label="Navegación principal"
    >
      {/* Header */}
      <div className="sidebar-header">
        <button
          className="sidebar-logo"
          onClick={() => { navigate('/'); handleLinkClick(); }}
          aria-label="Ir al Panel de Control"
        >
          <RestaurantBrand name={restaurantInfo.name} logo={restaurantInfo.logo} />
        </button>

        {/* Close button (mobile) */}
        <button
          className="d-md-none btn btn-sm"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#94a3b8',
            borderRadius: 6,
            padding: '0.25rem 0.5rem',
            lineHeight: 1,
          }}
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <i className="bi bi-x-lg fs-7"></i>
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-menu" aria-label="Módulos del sistema">
        {NAV_SECTIONS.map(section => {
          const visibleItems = section.items.filter(item =>
            item.roles.includes(currentRole as 'Administrador' | 'Mesero' | 'Cocina')
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {visibleItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                  onClick={handleLinkClick}
                  aria-label={item.label}
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="d-flex align-items-center gap-2">
          <div
            className="sidebar-footer-icon"
          >
            <i className="bi bi-shield-lock-fill"></i>
          </div>
          <div className="overflow-hidden">
            <div
              className="text-truncate fw-semibold"
              style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.2 }}
            >
              Sistema de gestión
            </div>
            <div style={{ fontSize: '0.68rem', color: '#475569', lineHeight: 1.2 }}>
              Modo Prototipo Visual
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

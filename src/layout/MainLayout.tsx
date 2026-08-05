import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastContainer } from '../components/common/ToastContainer';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar  = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Mientras el sidebar (drawer) está abierto en mobile:
  // - bloquea el scroll del body para que no se mueva el fondo detrás del overlay
  // - permite cerrarlo con la tecla Escape
  useEffect(() => {
    if (!sidebarOpen) return;

    document.body.classList.add('sidebar-locked');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('sidebar-locked');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen, closeSidebar]);

  return (
    <div className="app-container">
      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main */}
      <div className="app-main">
        <Topbar onMenuClick={openSidebar} />
        <main className="app-content" id="main-content">
          {children}
        </main>
        <ToastContainer />
      </div>
    </div>
  );
};
import React from 'react';
import { SearchBar } from '../common/SearchBar';

export type KitchenViewMode = 'mesa' | 'estacion';

interface KitchenToolbarProps {
  viewMode: KitchenViewMode;
  onViewModeChange: (mode: KitchenViewMode) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  hideReady: boolean;
  onToggleHideReady: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

/**
 * KitchenToolbar — Controles operativos del KDS, separados del header de
 * página para que quepan cómodamente en una sola fila en desktop y se
 * apilen sin fricción en móvil/tablet (dispositivo típico de cocina).
 */
export const KitchenToolbar: React.FC<KitchenToolbarProps> = ({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  hideReady,
  onToggleHideReady,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="section-card mb-4">
      <div className="section-card-body py-3 d-flex flex-wrap align-items-center gap-2">
        {/* Vista: Por Mesa / Por Estación */}
        <div
          className="btn-group flex-shrink-0"
          role="group"
          aria-label="Modo de visualización del KDS"
        >
          <button
            type="button"
            className={`btn fw-semibold ${viewMode === 'mesa' ? 'btn-brand text-white' : 'btn-outline-secondary'}`}
            style={{ borderRadius: '8px 0 0 8px' }}
            aria-pressed={viewMode === 'mesa'}
            onClick={() => onViewModeChange('mesa')}
          >
            <i className="bi bi-grid-3x3-gap-fill me-1" aria-hidden="true"></i>
            Por Mesa
          </button>
          <button
            type="button"
            className={`btn fw-semibold ${viewMode === 'estacion' ? 'btn-brand text-white' : 'btn-outline-secondary'}`}
            style={{ borderRadius: '0 8px 8px 0' }}
            aria-pressed={viewMode === 'estacion'}
            onClick={() => onViewModeChange('estacion')}
          >
            <i className="bi bi-diagram-3-fill me-1" aria-hidden="true"></i>
            Por Estación
          </button>
        </div>

        {/* Búsqueda por mesa o mesero */}
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Buscar por mesa o mesero..."
          className="flex-grow-1"
        />

        {/* Ocultar listos */}
        <button
          type="button"
          className={`btn fw-semibold flex-shrink-0 ${hideReady ? 'btn-brand-outline' : 'btn-outline-secondary'}`}
          style={{ borderRadius: 8 }}
          aria-pressed={hideReady}
          onClick={onToggleHideReady}
        >
          <i className={`bi ${hideReady ? 'bi-eye-slash-fill' : 'bi-eye-fill'} me-1`} aria-hidden="true"></i>
          <span className="d-none d-sm-inline">Ocultar Listos</span>
          <span className="d-inline d-sm-none">Listos</span>
        </button>

        {/* Sonido de alertas */}
        <button
          type="button"
          className={`btn-icon flex-shrink-0 ${soundEnabled ? 'btn-icon-primary' : ''}`}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? 'Silenciar alertas sonoras' : 'Activar alertas sonoras'}
          title={soundEnabled ? 'Silenciar alertas sonoras' : 'Activar alertas sonoras'}
          onClick={onToggleSound}
        >
          <i className={`bi ${soundEnabled ? 'bi-bell-fill' : 'bi-bell-slash-fill'}`} aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
};
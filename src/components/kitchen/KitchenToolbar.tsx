import React from 'react';
import { SearchBar } from '../common/SearchBar';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';

export type KitchenViewMode = 'mesa' | 'estacion';
export type KitchenOrderScope = 'all' | 'active' | 'ready';

interface KitchenToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  orderScope: KitchenOrderScope;
  onOrderScopeChange: (scope: KitchenOrderScope) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenIndisponible: () => void;
}

/**
 * KitchenToolbar — Controles operativos del KDS, separados del header de
 * página para que quepan cómodamente en una sola fila en desktop y se
 * apilen sin fricción en móvil/tablet (dispositivo típico de cocina).
 */
export const KitchenToolbar: React.FC<KitchenToolbarProps> = ({
  searchQuery,
  onSearchChange,
  orderScope,
  onOrderScopeChange,
  soundEnabled,
  onToggleSound,
  onOpenIndisponible,
}) => {
  return (
    <div className="section-card mb-4">
      <div className="section-card-body kds-toolbar">
        <div className="kds-toolbar-search">
          <label id="kdsSearchLabel" htmlFor="kdsSearch" className="kds-toolbar-label">Buscar</label>
          <SearchBar
            id="kdsSearch"
            labelledBy="kdsSearchLabel"
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Mesa, área o mesero..."
          />
        </div>

        <div className="kds-toolbar-control">
          <span id="kdsScopeLabel" className="kds-toolbar-label">Mostrar</span>
          <CustomDropdownSelect
            id="kdsOrderScope"
            labelId="kdsScopeLabel"
            value={orderScope}
            onChange={value => onOrderScopeChange(value as KitchenOrderScope)}
            size="sm"
            options={[
              { value: 'all', label: 'Todas las comandas', icon: 'bi-collection-fill', colorVariant: 'secondary' },
              { value: 'active', label: 'Solo en preparación', icon: 'bi-fire', colorVariant: 'warning' },
              { value: 'ready', label: 'Listas para pase', icon: 'bi-check-circle-fill', colorVariant: 'success' },
            ]}
          />
        </div>

        <div className="kds-toolbar-control kds-toolbar-sound-control">
          <span className="kds-toolbar-label">Alertas</span>
          <button
            type="button"
            className={`btn kds-toolbar-sound ${soundEnabled ? 'is-enabled' : ''}`}
            aria-pressed={soundEnabled}
            onClick={onToggleSound}
          >
            <i className={`bi ${soundEnabled ? 'bi-bell-fill' : 'bi-bell-slash-fill'}`} aria-hidden="true"></i>
            {soundEnabled ? 'Sonido activo' : 'Sonido apagado'}
          </button>
        </div>

        <div className="kds-toolbar-control kds-toolbar-tools">
          <span className="kds-toolbar-label">Herramientas</span>
          <button type="button" className="btn btn-outline-danger kds-toolbar-outage" onClick={onOpenIndisponible}>
            <i className="bi bi-slash-circle-fill" aria-hidden="true"></i>
            Notificar agotado
          </button>
        </div>
      </div>
    </div>
  );
};

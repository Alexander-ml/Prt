import React from 'react';

interface KitchenStatsRowProps {
  activeCommandas: number;
  itemsPendientes: number;
  itemsPreparando: number;
  commandasListas: number;
  urgentOrdersCount: number;
}

export const KitchenStatsRow: React.FC<KitchenStatsRowProps> = ({
  activeCommandas,
  itemsPendientes,
  itemsPreparando,
  commandasListas,
  urgentOrdersCount,
}) => {
  return (
    <section className="kds-summary mb-4" aria-label="Resumen operativo de cocina">
      <div className="kds-summary-item is-primary">
        <i className="bi bi-receipt" aria-hidden="true"></i>
        <span>Activas</span>
        <strong>{activeCommandas}</strong>
      </div>
      <div className="kds-summary-item">
        <i className="bi bi-hourglass-split" aria-hidden="true"></i>
        <span>Por iniciar</span>
        <strong>{itemsPendientes}</strong>
      </div>
      <div className="kds-summary-item">
        <i className="bi bi-fire" aria-hidden="true"></i>
        <span>Preparando</span>
        <strong>{itemsPreparando}</strong>
      </div>
      <div className="kds-summary-item is-ready">
        <i className="bi bi-check-circle-fill" aria-hidden="true"></i>
        <span>Listas</span>
        <strong>{commandasListas}</strong>
      </div>
      <div className={`kds-summary-urgent ${urgentOrdersCount > 0 ? 'has-urgent-orders' : ''}`}>
        <i className="bi bi-alarm-fill" aria-hidden="true"></i>
        <span>{urgentOrdersCount} urgente{urgentOrdersCount === 1 ? '' : 's'}</span>
      </div>
    </section>
  );
};

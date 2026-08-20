import React from 'react';

interface TableMetricsSummaryProps {
  total: number;
  available: number;
  occupied: number;
  reserved: number;
}

/** Resumen compacto de sala, mostrado exclusivamente en móvil. */
export const TableMetricsSummary: React.FC<TableMetricsSummaryProps> = ({
  total,
  available,
  occupied,
  reserved,
}) => (
  <section className="table-mobile-summary d-sm-none mb-4" aria-label="Resumen de mesas">
    <div>
      <p className="table-mobile-summary-label">Total de mesas</p>
      <p className="table-mobile-summary-total">{total}</p>
    </div>
    <div className="table-mobile-summary-states">
      <span className="is-available"><i className="bi bi-check-circle-fill" aria-hidden="true"></i>{available} disponibles</span>
      <span className="is-occupied"><i className="bi bi-people-fill" aria-hidden="true"></i>{occupied} ocupadas</span>
      <span className="is-reserved"><i className="bi bi-bookmark-star-fill" aria-hidden="true"></i>{reserved} reservadas</span>
    </div>
  </section>
);

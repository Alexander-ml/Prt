import React from 'react';
import type { Area, Table } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { TABLE_STATUS_META } from './tableStatusMeta';

interface MobileAreaListProps {
  areas: Area[];
  tables: Table[];
  onEdit: (area: Area) => void;
  onDelete: (area: Area) => void;
}

export const MobileAreaList: React.FC<MobileAreaListProps> = ({ areas, tables, onEdit, onDelete }) => {
  if (areas.length === 0) {
    return <EmptyState icon="bi-geo-alt" title="Aún no hay áreas configuradas" />;
  }

  return (
    <div className="table-config-mobile-list" aria-label="Áreas configuradas">
      {areas.map(area => {
        const assignedCount = tables.filter(table => table.areaId === area.id).length;
        return (
          <article className="table-config-mobile-item" key={area.id}>
            <div className="table-config-mobile-item-heading">
              <div className="min-w-0">
                <h3>{area.name}</h3>
                <p>{area.description || 'Sin descripción registrada'}</p>
              </div>
              <Badge status={`${assignedCount} mesas`} variant="primary" />
            </div>
            <div className="table-config-mobile-actions">
              <button type="button" className="btn btn-brand-outline" onClick={() => onEdit(area)}>
                <i className="bi bi-pencil-fill" aria-hidden="true"></i> Editar
              </button>
              <button type="button" className="btn btn-outline-danger" onClick={() => onDelete(area)}>
                <i className="bi bi-trash-fill" aria-hidden="true"></i> Eliminar
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
};

interface MobileTableListProps {
  tables: Table[];
  onEdit: (table: Table) => void;
  onDelete: (table: Table) => void;
}

export const MobileTableList: React.FC<MobileTableListProps> = ({ tables, onEdit, onDelete }) => {
  if (tables.length === 0) {
    return <EmptyState icon="bi-table" title="Aún no hay mesas registradas" />;
  }

  return (
    <div className="table-config-mobile-list" aria-label="Mesas registradas">
      {tables.map(table => {
        const status = TABLE_STATUS_META[table.status];
        return (
          <article className="table-config-mobile-item" key={table.id}>
            <div className="table-config-mobile-item-heading">
              <h3>Mesa #{table.number}</h3>
              <Badge status={status.label} variant={status.colorVariant} icon={status.icon} />
            </div>
            <dl className="table-config-mobile-details">
              <div><dt>Área</dt><dd>{table.areaName}</dd></div>
              <div><dt>Capacidad</dt><dd>{table.capacity} personas</dd></div>
            </dl>
            <div className="table-config-mobile-actions">
              <button type="button" className="btn btn-brand-outline" onClick={() => onEdit(table)}>
                <i className="bi bi-pencil-fill" aria-hidden="true"></i> Editar
              </button>
              <button type="button" className="btn btn-outline-danger" onClick={() => onDelete(table)}>
                <i className="bi bi-trash-fill" aria-hidden="true"></i> Eliminar
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
};

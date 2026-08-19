import React from 'react';
import type { LedgerEntry, Sale } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { formatMoney } from '../../utils/money';
import { isLedgerEntryVoided } from './accountingMeta';

interface LedgerTableProps {
  entries: LedgerEntry[];
  sales: Sale[];
  onEditEntry?: (entry: LedgerEntry) => void;
  onReverseEntry?: (entry: LedgerEntry) => void;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({ entries, sales, onEditEntry, onReverseEntry }) => {
  if (entries.length === 0) {
    return (
      <div className="py-3">
        <EmptyState
          icon="bi-journal"
          title="Sin asientos registrados"
          description="No hay movimientos contables en el período seleccionado."
        />
      </div>
    );
  }

  return (
    <div className="table-responsive-x">
      <table className="custom-table" style={{ minWidth: 800 }}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Referencia</th>
            <th className="text-end">Monto (S/)</th>
            <th className="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => {
            const voided = isLedgerEntryVoided(entry, sales);
            const canModify = !entry.reference?.startsWith('ven-') && !entry.isReversal && !entry.reversedBy;
            return (
              <tr key={entry.id} style={voided ? { opacity: 0.6 } : undefined}>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {entry.date}
                </td>
                <td>
                  <div className="d-flex flex-column gap-1 align-items-start">
                    <Badge
                      status={entry.type === 'ingreso' ? 'INGRESO' : 'EGRESO'}
                      variant={entry.type === 'ingreso' ? 'success' : 'danger'}
                    />
                    {voided && <Badge status="ANULADA" variant="dark" icon="bi-x-circle-fill" />}
                    {entry.isReversal && <Badge status="REVERSIÓN" variant="warning" icon="bi-arrow-counterclockwise" />}
                    {entry.reversedBy && <Badge status="REVERTIDO" variant="secondary" icon="bi-slash-circle" />}
                  </div>
                </td>
                <td className="fw-semibold" style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                  {entry.categoryName}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                  {entry.description}
                  {entry.editedAt && (
                    <div style={{ fontSize: '0.7rem', fontStyle: 'italic', color: 'var(--color-amber)' }}>
                      Editado: {entry.editReason}
                    </div>
                  )}
                </td>
                <td>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {entry.reference}
                  </span>
                </td>
                <td
                  className="text-end fw-bold"
                  style={{
                    fontSize: '0.95rem',
                    color: voided ? 'var(--text-muted)' : entry.type === 'ingreso' ? 'var(--color-emerald)' : 'var(--color-rose)',
                    textDecoration: voided || entry.reversedBy ? 'line-through' : undefined,
                  }}
                >
                  {entry.type === 'ingreso' ? '+' : '−'} {formatMoney(entry.amount)}
                </td>
                <td className="text-end">
                  {canModify && (
                    <div className="d-inline-flex gap-1">
                      {onEditEntry && (
                        <button
                          type="button"
                          className="btn-icon btn-icon-primary"
                          aria-label={`Editar asiento ${entry.id}`}
                          onClick={() => onEditEntry(entry)}
                          title="Editar asiento"
                        >
                          <i className="bi bi-pencil-fill" aria-hidden="true"></i>
                        </button>
                      )}
                      {onReverseEntry && (
                        <button
                          type="button"
                          className="btn-icon btn-icon-danger"
                          aria-label={`Revertir asiento ${entry.id}`}
                          onClick={() => onReverseEntry(entry)}
                          title="Revertir asiento"
                        >
                          <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

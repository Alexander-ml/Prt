import React from 'react';
import type { LedgerEntry, Sale } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { formatMoney } from '../../utils/money';
import { isLedgerEntryVoided } from './accountingMeta';

interface LedgerTableProps {
  entries: LedgerEntry[];
  sales: Sale[];
}

/**
 * LedgerTable — tabla presentacional del Libro Diario. Cuando un asiento
 * automático de venta referencia una venta ya anulada, la fila NO
 * desaparece (sería borrar historia contable real): se muestra con badge
 * "Anulada" y el monto tachado, dejando claro por qué ya no suma en los
 * KPIs de arriba — mismo componente `Badge` que ya usa `HistoryView` para
 * el estado de una venta.
 */
export const LedgerTable: React.FC<LedgerTableProps> = ({ entries, sales }) => {
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
      <table className="custom-table" style={{ minWidth: 700 }}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Referencia</th>
            <th className="text-end">Monto (S/)</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => {
            const voided = isLedgerEntryVoided(entry, sales);
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
                  </div>
                </td>
                <td className="fw-semibold" style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                  {entry.categoryName}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{entry.description}</td>
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
                    textDecoration: voided ? 'line-through' : undefined,
                  }}
                >
                  {entry.type === 'ingreso' ? '+' : '−'} {formatMoney(entry.amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
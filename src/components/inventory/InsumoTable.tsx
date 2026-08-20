import React, { useState } from 'react';
import type { Insumo } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { formatMoney } from '../../utils/money';
import { STOCK_LEVEL_META, getStockLevel, getStockPercentage } from './inventoryMeta';

interface InsumoTableProps {
  insumos: Insumo[];
  onEdit: (insumo: Insumo) => void;
  onRegisterMovement: (insumo: Insumo) => void;
  onDelete: (insumo: Insumo) => void;
}

/**
 * InsumoTable — Tabla presentacional pura del listado de insumos (RF-70,
 * RF-71). No conoce nada de Categorías como entidad ni de Recetas — solo
 * lo necesario para listar y disparar edición/movimiento (Interface
 * Segregation), igual que `CategoryTable` en Catálogo. Usa
 * `STOCK_LEVEL_META`/`getStockLevel` para la barra de progreso, sin
 * ternarios manuales.
 */
export const InsumoTable: React.FC<InsumoTableProps> = ({ insumos, onEdit, onRegisterMovement, onDelete }) => {
  const [deleteTarget, setDeleteTarget] = useState<Insumo | null>(null);

  return (
    <>
      <div className="table-responsive-x">
        <div className="custom-table-container">
          <table className="custom-table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Categoría</th>
                <th>Stock Actual</th>
                <th>Mín. Reposición</th>
                <th>Costo Un.</th>
                <th>Disponibilidad</th>
                <th>Última Reposición</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {insumos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    <EmptyState
                      icon="bi-box-seam"
                      title="No se encontraron insumos"
                      description="Intenta cambiar los filtros de búsqueda o registra un nuevo insumo."
                    />
                  </td>
                </tr>
              ) : (
                insumos.map(ins => {
                  const isLow = ins.currentStock <= ins.minStock;
                  const pct = getStockPercentage(ins);
                  const levelMeta = STOCK_LEVEL_META[getStockLevel(ins)];

                  return (
                    <tr key={ins.id}>
                      <td>
                        <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{ins.name}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
                          {ins.categoryName}
                        </span>
                      </td>
                      <td>
                        <span className={`fw-bold fs-6 ${isLow ? 'text-danger' : ''}`} style={{ color: isLow ? undefined : 'var(--text-primary)' }}>
                          {ins.currentStock} {ins.unit}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                          {ins.minStock} {ins.unit}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {formatMoney(ins.costPerUnit)}
                        </span>
                      </td>
                      <td style={{ minWidth: 130 }}>
                        <div className="stock-progress-bar mb-1">
                          <div
                            className={`stock-progress-fill ${levelMeta.fillClass}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: levelMeta.textColor }}>
                          {pct}% del óptimo · {levelMeta.label}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {ins.lastRestockDate || 'Sin registro'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-1">
                          <button
                            type="button"
                            className="btn-icon btn-icon-success"
                            title="Registrar Movimiento de Stock"
                            aria-label={`Registrar Movimiento de ${ins.name}`}
                            onClick={() => onRegisterMovement(ins)}
                          >
                            <i className="bi bi-arrow-down-up"></i>
                          </button>
                          <button
                            type="button"
                            className="btn-icon btn-icon-primary"
                            title="Editar Insumo"
                            aria-label={`Editar ${ins.name}`}
                            onClick={() => onEdit(ins)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            type="button"
                            className="btn-icon btn-icon-danger"
                            title="Eliminar Insumo"
                            aria-label={`Eliminar ${ins.name}`}
                            onClick={() => setDeleteTarget(ins)}
                          >
                            <i className="bi bi-trash3-fill"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDelete(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        title="Eliminar Insumo"
        message={`¿Estás seguro de eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  );
};
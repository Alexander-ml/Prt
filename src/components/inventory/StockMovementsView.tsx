import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SectionCard } from '../common/SectionCard';
import { EmptyState } from '../common/EmptyState';
import type { StockMovementType } from '../../types';

const MOVEMENT_LABELS: Record<StockMovementType, string> = {
  compra: 'Compra',
  consumo_venta: 'Consumo por Venta',
  consumo_receta: 'Consumo por Receta',
  merma: 'Merma',
  ajuste_entrada: 'Ajuste (+)',
  ajuste_salida: 'Ajuste (-)',
  devolucion: 'Devolución',
  transferencia: 'Transferencia'
};

const MOVEMENT_COLORS: Record<StockMovementType, string> = {
  compra: '#059669',
  consumo_venta: '#dc2626',
  consumo_receta: '#dc2626',
  merma: '#d97706',
  ajuste_entrada: '#059669',
  ajuste_salida: '#dc2626',
  devolucion: '#2563eb',
  transferencia: '#7c3aed'
};

interface StockMovementsViewProps {
  insumoId?: string;
}

export const StockMovementsView: React.FC<StockMovementsViewProps> = ({ insumoId }) => {
  const { stockMovements, insumos, addStockMovement } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    insumoId: '',
    type: 'compra' as StockMovementType,
    quantity: 0,
    reason: '',
    referenceId: ''
  });

  const filteredMovements = useMemo(() => {
    const list = insumoId
      ? stockMovements.filter(m => m.insumoId === insumoId)
      : stockMovements;
    return list.filter(m => {
      const matchesSearch = m.insumoName.toLowerCase().includes(search.toLowerCase()) ||
        (m.reason?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesType = typeFilter === 'todos' || m.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [stockMovements, search, typeFilter, insumoId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.insumoId || formData.quantity <= 0) return;
    const insumo = insumos.find(i => i.id === formData.insumoId);
    if (!insumo) return;
    const nextStock = Math.max(0, insumo.currentStock + (['compra', 'ajuste_entrada', 'devolucion'].includes(formData.type) ? formData.quantity : -formData.quantity));
    addStockMovement({
      insumoId: insumo.id,
      insumoName: insumo.name,
      type: formData.type,
      quantity: ['compra', 'ajuste_entrada', 'devolucion'].includes(formData.type) ? formData.quantity : -formData.quantity,
      unit: insumo.unit,
      previousStock: insumo.currentStock,
      newStock: nextStock,
      reason: formData.reason || undefined,
      referenceId: formData.referenceId || undefined
    });
    setFormData({ insumoId: '', type: 'compra', quantity: 0, reason: '', referenceId: '' });
    setIsModalOpen(false);
  };

  return (
    <div className="animate-fadeinup">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex gap-2 flex-wrap">
          <input
            type="text"
            className="form-control"
            style={{ minWidth: 220, borderRadius: 8 }}
            placeholder="Buscar movimiento..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="form-select"
            style={{ minWidth: 180, borderRadius: 8 }}
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="todos">Todos los tipos</option>
            {Object.entries(MOVEMENT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-brand fw-semibold" onClick={() => setIsModalOpen(true)}>
          <i className="bi bi-plus-lg me-1" />
          Nuevo Movimiento
        </button>
      </div>

      <SectionCard icon="bi-arrow-repeat" title="Kardex de Stock" noPadding>
        <div className="table-responsive-x">
          <div className="custom-table-container">
            <table className="custom-table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Insumo</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Stock Anterior</th>
                  <th>Stock Nuevo</th>
                  <th>Motivo / Referencia</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <EmptyState
                        icon="bi-arrow-repeat"
                        title="Sin movimientos"
                        description="Registra el primer movimiento de stock para este insumo."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredMovements.slice(0, 100).map(m => (
                    <tr key={m.id}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{m.createdAt}</td>
                      <td>
                        <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{m.insumoName}</span>
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>{m.unit}</div>
                      </td>
                      <td>
                        <span className="badge fw-semibold" style={{ background: `${MOVEMENT_COLORS[m.type]}18`, color: MOVEMENT_COLORS[m.type], border: `1px solid ${MOVEMENT_COLORS[m.type]}40`, borderRadius: 99, fontSize: '0.72rem' }}>
                          {MOVEMENT_LABELS[m.type]}
                        </span>
                      </td>
                      <td>
                        <span className={`fw-bold ${m.quantity >= 0 ? 'text-success' : 'text-danger'}`}>
                          {m.quantity >= 0 ? '+' : ''}{m.quantity.toFixed ? m.quantity.toFixed(2) : m.quantity}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{m.previousStock.toFixed ? m.previousStock.toFixed(2) : m.previousStock}</td>
                      <td style={{ color: 'var(--text-primary)' }}>{m.newStock.toFixed ? m.newStock.toFixed(2) : m.newStock}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {m.reason || '-'}
                        {m.referenceId && <div style={{ fontSize: '0.72rem' }}>{m.referenceId}</div>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>

      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Registrar Movimiento de Stock</h5>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Insumo *</label>
                    <select
                      className="form-select"
                      value={formData.insumoId}
                      onChange={e => setFormData(prev => ({ ...prev, insumoId: e.target.value }))}
                      required
                    >
                      <option value="">Seleccione un insumo</option>
                      {insumos.map(i => (
                        <option key={i.id} value={i.id}>{i.name} (Stock: {i.currentStock} {i.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Tipo *</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as StockMovementType }))}
                    >
                      {Object.entries(MOVEMENT_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Cantidad *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="form-control"
                      value={formData.quantity || ''}
                      onChange={e => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Motivo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.reason}
                      onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Ej. Compra semanal, rotura..."
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Referencia</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.referenceId}
                      onChange={e => setFormData(prev => ({ ...prev, referenceId: e.target.value }))}
                      placeholder="Ej. FAC-123, orden-456..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-brand fw-semibold">Guardar Movimiento</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
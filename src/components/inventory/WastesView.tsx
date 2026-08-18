import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SectionCard } from '../common/SectionCard';
import { EmptyState } from '../common/EmptyState';
import { formatMoney } from '../../utils/money';
import type { WasteReason } from '../../types';

const WASTE_LABELS: Record<WasteReason, string> = {
  caducidad: 'Caducidad',
  rotura: 'Rotura',
  preparacion: 'En Preparación',
  devolucion_cliente: 'Devolución Cliente',
  ajuste_inventario: 'Ajuste Inventario',
  otro: 'Otro'
};

const WASTE_COLORS: Record<WasteReason, string> = {
  caducidad: '#d97706',
  rotura: '#dc2626',
  preparacion: '#f59e0b',
  devolucion_cliente: '#2563eb',
  ajuste_inventario: '#7c3aed',
  otro: '#64748b'
};

export const WastesView: React.FC = () => {
  const { wasteEntries, insumos, addWasteEntry } = useApp();
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    insumoId: '',
    quantity: 0,
    reason: 'rotura' as WasteReason,
    costPerUnit: 0
  });

  const filteredWastes = useMemo(() => {
    return wasteEntries.filter(w => {
      const matchesSearch = w.insumoName.toLowerCase().includes(search.toLowerCase());
      const matchesReason = reasonFilter === 'todos' || w.reason === reasonFilter;
      return matchesSearch && matchesReason;
    });
  }, [wasteEntries, search, reasonFilter]);

  const totalWasteCost = useMemo(() => wasteEntries.reduce((sum, w) => sum + w.totalCost, 0), [wasteEntries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.insumoId || formData.quantity <= 0) return;
    const insumo = insumos.find(i => i.id === formData.insumoId);
    if (!insumo) return;
    addWasteEntry({
      insumoId: insumo.id,
      insumoName: insumo.name,
      quantity: formData.quantity,
      unit: insumo.unit,
      reason: formData.reason,
      costPerUnit: formData.costPerUnit || insumo.costPerUnit,
      totalCost: 0
    });
    setFormData({ insumoId: '', quantity: 0, reason: 'rotura', costPerUnit: 0 });
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
            placeholder="Buscar merma..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="form-select"
            style={{ minWidth: 180, borderRadius: 8 }}
            value={reasonFilter}
            onChange={e => setReasonFilter(e.target.value)}
          >
            <option value="todos">Todos los motivos</option>
            {Object.entries(WASTE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-brand fw-semibold" onClick={() => setIsModalOpen(true)}>
          <i className="bi bi-plus-lg me-1" />
          Registrar Merma
        </button>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="text-muted fs-7">Total Mermas (registradas)</div>
              <div className="fw-bold fs-5">{wasteEntries.length}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="text-muted fs-7">Costo Total de Mermas</div>
              <div className="fw-bold fs-5 text-danger">{formatMoney(totalWasteCost)}</div>
            </div>
          </div>
        </div>
      </div>

      <SectionCard icon="bi-box-seam" title="Registro de Mermas y Roturas" noPadding>
        <div className="table-responsive-x">
          <div className="custom-table-container">
            <table className="custom-table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Insumo</th>
                  <th>Cantidad</th>
                  <th>Motivo</th>
                  <th>Costo Unitario</th>
                  <th>Costo Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredWastes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <EmptyState
                        icon="bi-box-seam"
                        title="Sin mermas registradas"
                        description="Registra la primera merma para comenzar el control."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredWastes.slice(0, 100).map(w => (
                    <tr key={w.id}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{w.createdAt}</td>
                      <td>
                        <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{w.insumoName}</span>
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>{w.unit}</div>
                      </td>
                      <td className="text-danger fw-bold">{w.quantity.toFixed(2)}</td>
                      <td>
                        <span className="badge fw-semibold" style={{ background: `${WASTE_COLORS[w.reason]}18`, color: WASTE_COLORS[w.reason], border: `1px solid ${WASTE_COLORS[w.reason]}40`, borderRadius: 99, fontSize: '0.72rem' }}>
                          {WASTE_LABELS[w.reason]}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatMoney(w.costPerUnit)}</td>
                      <td className="fw-bold text-danger">{formatMoney(w.totalCost)}</td>
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
                <h5 className="modal-title">Registrar Merma / Rotura</h5>
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
                    <label className="form-label fw-semibold">Motivo *</label>
                    <select
                      className="form-select"
                      value={formData.reason}
                      onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value as WasteReason }))}
                    >
                      {Object.entries(WASTE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Costo Unitario (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.costPerUnit || ''}
                      onChange={e => setFormData(prev => ({ ...prev, costPerUnit: parseFloat(e.target.value) || 0 }))}
                      placeholder="Dejar vacío para usar costo actual del insumo"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-brand fw-semibold">Guardar Merma</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SectionCard } from '../common/SectionCard';
import { EmptyState } from '../common/EmptyState';
import type { InventoryAlert, PurchaseSuggestion } from '../../types';
import { getStockPercentage, getStockLevel, STOCK_LEVEL_META } from './inventoryMeta';

const ALERT_LABELS: Record<InventoryAlert['type'], string> = {
  stock_critico: 'Stock Crítico',
  stock_bajo: 'Stock Bajo',
  sin_movimiento: 'Sin Movimiento',
  costo_creciente: 'Costo Creciente'
};

const ALERT_COLORS: Record<InventoryAlert['type'], string> = {
  stock_critico: '#dc2626',
  stock_bajo: '#d97706',
  sin_movimiento: '#64748b',
  costo_creciente: '#7c3aed'
};

export const AlertsView: React.FC = () => {
  const { insumos, inventoryAlerts, stockMovements, supplierPriceHistory, addInventoryAlert, clearInventoryAlert } = useApp();
  const [filter, setFilter] = useState<string>('todos');

  const suggestions = useMemo<PurchaseSuggestion[]>(() => {
    return insumos
      .map(ins => {
        const level = getStockLevel(ins);
        if (level === 'optimo') return null;
        const suggestedQty = Math.max(0, (ins.minStock * 2) - ins.currentStock);
        const recentCosts = supplierPriceHistory.filter(p => p.insumoId === ins.id).slice(-3).map(p => p.costPerUnit);
        const avgCost = recentCosts.length ? recentCosts.reduce((a, b) => a + b, 0) / recentCosts.length : ins.costPerUnit;
        const recentMovements = stockMovements.filter(m => m.insumoId === ins.id).slice(-5);
        const hasMovements = recentMovements.length > 0;
        const lastMovement = recentMovements[0];
        const reason = level === 'critico'
          ? `Reponer urgente: stock crítico (${ins.currentStock} ${ins.unit}).`
          : level === 'bajo'
            ? hasMovements && lastMovement
              ? `Último movimiento: ${lastMovement.type.replace(/_/g, ' ')} (${lastMovement.createdAt.split(' ')[0]}).`
              : `Stock bajo (${ins.currentStock} ${ins.unit}) sin movimientos recientes.`
            : 'Sin detalles.';
        return {
          insumoId: ins.id,
          insumoName: ins.name,
          unit: ins.unit,
          currentStock: ins.currentStock,
          minStock: ins.minStock,
          maxStock: ins.minStock * 2,
          suggestedQuantity: Number(suggestedQty.toFixed(2)),
          reason,
          avgCost
        } as PurchaseSuggestion;
      })
      .filter((s): s is PurchaseSuggestion => s !== null && s.suggestedQuantity > 0)
      .sort((a, b) => {
        const order = { critico: 0, bajo: 1 };
        const levelA = getStockLevel({ ...a, maxStock: a.maxStock, minStock: a.minStock } as any);
        const levelB = getStockLevel({ ...b, maxStock: b.maxStock, minStock: b.minStock } as any);
        return (order as any)[levelA] - (order as any)[levelB];
      });
  }, [insumos, stockMovements, supplierPriceHistory]);

  const filteredAlerts = useMemo(() => {
    if (filter === 'todos') return inventoryAlerts;
    return inventoryAlerts.filter(a => a.type === filter);
  }, [inventoryAlerts, filter]);

  const criticalCount = useMemo(() => suggestions.filter(s => getStockLevel({ ...s, maxStock: s.maxStock, minStock: s.minStock } as any) === 'critico').length, [suggestions]);
  const lowCount = useMemo(() => suggestions.filter(s => getStockLevel({ ...s, maxStock: s.maxStock, minStock: s.minStock } as any) === 'bajo').length, [suggestions]);

  return (
    <div className="animate-fadeinup">
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="text-muted fs-7">Alertas Activas</div>
              <div className="fw-bold fs-5">{inventoryAlerts.length}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="text-muted fs-7">Insumos a Reponer (Críticos)</div>
              <div className="fw-bold fs-5 text-danger">{criticalCount}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="text-muted fs-7">Insumos a Reponer (Bajos)</div>
              <div className="fw-bold fs-5 text-warning">{lowCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <select
          className="form-select"
          style={{ minWidth: 200, borderRadius: 8 }}
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="todos">Todas las alertas</option>
          {Object.entries(ALERT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button className="btn btn-outline-brand fw-semibold" onClick={() => {
          insumos.filter(i => getStockLevel(i) !== 'optimo').forEach(ins => {
            const pct = getStockPercentage(ins);
            const type: InventoryAlert['type'] = pct < 50 ? 'stock_critico' : 'stock_bajo';
            addInventoryAlert({
              insumoId: ins.id,
              insumoName: ins.name,
              type,
              message: `${ins.name}: ${pct.toFixed(0)}% del óptimo`
            });
          });
        }}>
          <i className="bi bi-bell me-1" />
          Generar Alertas
        </button>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <SectionCard icon="bi-bell" title="Alertas de Inventario" noPadding>
            <div className="table-responsive-x">
              <div className="custom-table-container">
                <table className="custom-table" style={{ minWidth: 500 }}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Mensaje</th>
                      <th className="text-end">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4">
                          <EmptyState
                            icon="bi-bell"
                            title="Sin alertas"
                            description="No hay alertas registradas en este momento."
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredAlerts.slice(0, 50).map(a => (
                        <tr key={a.id}>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{a.createdAt}</td>
                          <td>
                            <span className="badge fw-semibold" style={{ background: `${ALERT_COLORS[a.type]}18`, color: ALERT_COLORS[a.type], border: `1px solid ${ALERT_COLORS[a.type]}40`, borderRadius: 99, fontSize: '0.72rem' }}>
                              {ALERT_LABELS[a.type]}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{a.message}</td>
                          <td className="text-end">
                            <button type="button" className="btn btn-sm btn-light" onClick={() => clearInventoryAlert(a.id)}>
                              <i className="bi bi-check2 me-1" />
                              Leída
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="col-lg-6">
          <SectionCard icon="bi-cart" title="Sugerencias de Reposición" noPadding>
            <div className="table-responsive-x">
              <div className="custom-table-container">
                <table className="custom-table" style={{ minWidth: 500 }}>
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Nivel</th>
                      <th>Sugerido</th>
                      <th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4">
                          <EmptyState
                            icon="bi-cart"
                            title="Todo en orden"
                            description="No hay insumos que requieran reposición urgente."
                          />
                        </td>
                      </tr>
                    ) : (
                      suggestions.map(s => {
                        const ins = insumos.find(i => i.id === s.insumoId);
                        const level = ins ? getStockLevel(ins) : 'bajo';
                        const levelMeta = STOCK_LEVEL_META[level];
                        return (
                          <tr key={s.insumoId}>
                            <td>
                              <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{s.insumoName}</span>
                              <div className="text-muted" style={{ fontSize: '0.78rem' }}>Stock: {s.currentStock} / {s.minStock} {s.unit}</div>
                            </td>
                            <td>
                              <span className="badge" style={{ background: `${levelMeta.colorVariant === 'success' ? '#059669' : levelMeta.colorVariant === 'warning' ? '#d97706' : '#dc2626'}18`, color: levelMeta.colorVariant === 'success' ? '#059669' : levelMeta.colorVariant === 'warning' ? '#d97706' : '#dc2626', border: `1px solid ${levelMeta.colorVariant === 'success' ? '#059669' : levelMeta.colorVariant === 'warning' ? '#d97706' : '#dc2626'}40`, borderRadius: 99, fontSize: '0.72rem' }}>
                                {levelMeta.label}
                              </span>
                            </td>
                            <td className="fw-bold">{s.suggestedQuantity.toFixed(2)} {s.unit}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{s.reason}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
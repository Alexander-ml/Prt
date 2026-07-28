import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Insumo } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { StatCard } from '../components/common/StatCard';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';

const CATEGORIES = ['todas', 'Carnes', 'Mariscos', 'Licores', 'Abarrotes', 'Lácteos', 'Verduras'];

export const InventoryPage: React.FC = () => {
  const {
    insumos,
    addInsumo,
    updateInsumo,
    registerInsumoMovement,
    currentRole
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');

  // Insumo Modal state (RF-66, RF-67)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'Kg',
    currentStock: 10,
    minStock: 5,
    costPerUnit: 20,
    category: 'Carnes'
  });

  // Movement Modal state (RF-68, RF-69)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [targetInsumo, setTargetInsumo] = useState<Insumo | null>(null);
  const [movementQty, setMovementQty] = useState<number>(5);
  const [isRestock, setIsRestock] = useState<boolean>(true);

  // Filtered insumos (RF-70, RF-71)
  const filteredInsumos = useMemo(() => {
    return insumos.filter(ins => {
      const matchesSearch = ins.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'todas' || ins.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [insumos, searchQuery, selectedCategory]);

  // Low stock list (RF-72)
  const lowStockInsumos = insumos.filter(i => i.currentStock <= i.minStock);

  const handleSubmitInsumo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingInsumo) {
      updateInsumo(editingInsumo.id, {
        name: formData.name,
        unit: formData.unit,
        currentStock: Number(formData.currentStock),
        minStock: Number(formData.minStock),
        costPerUnit: Number(formData.costPerUnit),
        category: formData.category
      });
    } else {
      addInsumo({
        name: formData.name,
        unit: formData.unit,
        currentStock: Number(formData.currentStock),
        minStock: Number(formData.minStock),
        costPerUnit: Number(formData.costPerUnit),
        category: formData.category
      });
    }
    setIsModalOpen(false);
  };

  const handleOpenModal = (ins?: Insumo) => {
    if (ins) {
      setEditingInsumo(ins);
      setFormData({
        name: ins.name,
        unit: ins.unit,
        currentStock: ins.currentStock,
        minStock: ins.minStock,
        costPerUnit: ins.costPerUnit,
        category: ins.category
      });
    } else {
      setEditingInsumo(null);
      setFormData({
        name: '',
        unit: 'Kg',
        currentStock: 10,
        minStock: 5,
        costPerUnit: 25,
        category: 'Abarrotes'
      });
    }
    setIsModalOpen(true);
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInsumo || movementQty <= 0) return;
    registerInsumoMovement(targetInsumo.id, movementQty, isRestock);
    setIsMovementModalOpen(false);
  };

  if (currentRole !== 'Administrador') {
    return (
      <div className="container-fluid p-0">
        <EmptyState
          icon="bi-boxes"
          title="Acceso Restringido"
          description="Este módulo es administrado únicamente por el Administrador en esta etapa del sistema."
        />
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 animate-fadeinup">

      {/* ── Page Header ── */}
      <PageHeader
        icon="bi-boxes"
        title="Inventario e Insumos"
        subtitle="Control de insumos disponibles, alertas de reposición y movimientos de stock (RF-66 – RF-72)."
        actions={
          <button
            className="btn btn-brand fw-semibold"
            onClick={() => handleOpenModal()}
            aria-label="Registrar nuevo insumo"
          >
            <i className="bi bi-plus-lg me-2" />
            Registrar Insumo
          </button>
        }
      />

      {/* ── Stat Cards Row ── */}
      <div className="row g-3 mb-4 stagger-children">
        <div className="col-12 col-sm-4">
          <StatCard
            title="Total Insumos"
            value={insumos.length}
            icon="bi-boxes"
            colorTheme="indigo"
          />
        </div>
        <div className="col-12 col-sm-4">
          <StatCard
            title="Bajo Stock Mínimo"
            value={lowStockInsumos.length}
            icon="bi-exclamation-triangle-fill"
            colorTheme="rose"
          />
        </div>
        <div className="col-12 col-sm-4">
          <StatCard
            title="Stock Suficiente"
            value={insumos.length - lowStockInsumos.length}
            icon="bi-shield-check"
            colorTheme="emerald"
          />
        </div>
      </div>

      {/* ── Low Stock Alert Banner (RF-72) ── */}
      {lowStockInsumos.length > 0 && (
        <div className="alert alert-danger border-danger-subtle rounded-3 p-3 mb-4 shadow-sm">
          <div className="d-flex align-items-center gap-2 mb-2">
            <i className="bi bi-exclamation-octagon-fill fs-5 text-danger" />
            <strong className="fs-7">
              Alerta de Reposición Urgente (RF-72) —{' '}
              {lowStockInsumos.length} insumo{lowStockInsumos.length > 1 ? 's' : ''} por debajo del mínimo
            </strong>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {lowStockInsumos.map(ins => (
              <span
                key={ins.id}
                className="badge rounded-pill fs-7"
                style={{ background: '#dc3545', color: '#fff', padding: '5px 12px' }}
              >
                {ins.name}: {ins.currentStock} / {ins.minStock} {ins.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <SectionCard className="mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-5">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar insumo por nombre (RF-70)..."
            />
          </div>
          <div className="col-12 col-md-7 d-flex align-items-center justify-content-md-end gap-2 flex-wrap">
            <span className="fs-7 text-muted fw-semibold me-1">Categoría:</span>
            <ul className="nav nav-pills gap-1 flex-wrap mb-0">
              {CATEGORIES.map(cat => (
                <li className="nav-item" key={cat}>
                  <button
                    className={`nav-link py-1 px-3 fs-7${selectedCategory === cat ? ' active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                    style={{ borderRadius: 20, fontWeight: 500 }}
                  >
                    {cat === 'todas' ? 'Todas' : cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionCard>

      {/* ── Main Table ── */}
      <SectionCard noPadding>
        <div className="table-responsive-x">
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Categoría</th>
                  <th>Stock Actual</th>
                  <th>Mín. Reposición</th>
                  <th>Costo Un.</th>
                  <th style={{ minWidth: 160 }}>Disponibilidad</th>
                  <th>Última Reposición</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInsumos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted fs-7">
                      <i className="bi bi-inbox fs-3 d-block mb-2 opacity-50" />
                      No se encontraron insumos con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  filteredInsumos.map(ins => {
                    const isLow = ins.currentStock <= ins.minStock;

                    // Disponibilidad progress bar (requirement #7)
                    const stockRatio = ins.minStock > 0 ? ins.currentStock / (ins.minStock * 2) : 1;
                    const pct = Math.min(100, Math.round(stockRatio * 100));
                    const fillClass = pct < 50 ? 'critical' : pct < 80 ? 'low' : 'ok';

                    return (
                      <tr key={ins.id}>
                        <td>
                          <div className="fw-bold text-dark">{ins.name}</div>
                        </td>
                        <td>
                          <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-1">
                            {ins.category}
                          </span>
                        </td>
                        <td>
                          <span
                            className="fw-bold fs-7"
                            style={{ color: isLow ? '#dc3545' : 'inherit' }}
                          >
                            {ins.currentStock} {ins.unit}
                          </span>
                        </td>
                        <td>
                          <span className="text-muted fs-7">
                            {ins.minStock} {ins.unit}
                          </span>
                        </td>
                        <td className="fs-7">
                          S/ {ins.costPerUnit.toFixed(2)} / {ins.unit}
                        </td>
                        <td>
                          <div className="stock-progress-bar">
                            <div
                              className={`stock-progress-fill ${fillClass}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div
                            className="fs-7 mt-1"
                            style={{
                              color: fillClass === 'critical' ? '#dc3545'
                                : fillClass === 'low' ? '#d97706'
                                : '#10b981',
                              fontWeight: 600
                            }}
                          >
                            {pct}% del óptimo
                          </div>
                        </td>
                        <td>
                          <small className="text-muted">{ins.lastRestockDate}</small>
                        </td>
                        <td className="text-end">
                          <div className="btn-icon d-inline-flex gap-1">
                            <button
                              className="btn-icon-success"
                              title="Registrar Movimiento de Stock (RF-68, RF-69)"
                              aria-label={`Registrar movimiento para ${ins.name}`}
                              onClick={() => {
                                setTargetInsumo(ins);
                                setMovementQty(5);
                                setIsRestock(true);
                                setIsMovementModalOpen(true);
                              }}
                            >
                              <i className="bi bi-box-arrow-in-down" />
                            </button>
                            <button
                              className="btn-icon-primary"
                              title="Editar Insumo (RF-67)"
                              aria-label={`Editar insumo ${ins.name}`}
                              onClick={() => handleOpenModal(ins)}
                            >
                              <i className="bi bi-pencil-square" />
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
      </SectionCard>

      {/* ── Insumo Modal (RF-66, RF-67) ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInsumo ? 'Editar Insumo (RF-67)' : 'Registrar Nuevo Insumo (RF-66)'}
      >
        <form onSubmit={handleSubmitInsumo}>
          {/* Nombre */}
          <div className="mb-3">
            <label className="form-label fs-7 fw-semibold text-dark">Nombre del Insumo *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Lomo Fino de Res"
              required
              value={formData.name}
              style={{ borderRadius: 8 }}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Unidad + Categoría */}
          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label fs-7 fw-semibold text-dark">Unidad de Medida *</label>
              <select
                className="form-select"
                value={formData.unit}
                style={{ borderRadius: 8 }}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="Kg">Kilogramos (Kg)</option>
                <option value="Lt">Litros (Lt)</option>
                <option value="Unidades">Unidades</option>
                <option value="Botella">Botellas</option>
                <option value="Cajas">Cajas</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label fs-7 fw-semibold text-dark">Categoría *</label>
              <select
                className="form-select"
                value={formData.category}
                style={{ borderRadius: 8 }}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Carnes">Carnes</option>
                <option value="Mariscos">Mariscos</option>
                <option value="Licores">Licores</option>
                <option value="Abarrotes">Abarrotes</option>
                <option value="Lácteos">Lácteos</option>
                <option value="Verduras">Verduras</option>
              </select>
            </div>
          </div>

          {/* Numeric fields */}
          <div className="row g-3 mb-4">
            <div className="col-4">
              <label className="form-label fs-7 fw-semibold text-dark">Stock Inicial</label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="form-control"
                required
                value={formData.currentStock}
                style={{ borderRadius: 8 }}
                onChange={e => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="col-4">
              <label className="form-label fs-7 fw-semibold text-dark">Stock Mínimo</label>
              <input
                type="number"
                min="1"
                step="0.5"
                className="form-control"
                required
                value={formData.minStock}
                style={{ borderRadius: 8 }}
                onChange={e => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 1 })}
              />
            </div>
            <div className="col-4">
              <label className="form-label fs-7 fw-semibold text-dark">Costo Un. (S/)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="form-control"
                required
                value={formData.costPerUnit}
                style={{ borderRadius: 8 }}
                onChange={e => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-light" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-brand fw-semibold">
              <i className="bi bi-check2 me-1" />
              Guardar Insumo
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Movement Modal (RF-68, RF-69) ── */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title={`Movimiento de Stock: ${targetInsumo?.name}`}
      >
        <form onSubmit={handleMovementSubmit}>
          {/* Insumo summary card */}
          {targetInsumo && (
            <div
              className="rounded-3 p-3 mb-4 d-flex align-items-center gap-3"
              style={{ background: 'var(--bs-secondary-bg, #f8f9fa)' }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 44, height: 44, background: '#e0e7ff' }}
              >
                <i className="bi bi-boxes" style={{ color: '#4f46e5', fontSize: 20 }} />
              </div>
              <div>
                <div className="fw-bold text-dark">{targetInsumo.name}</div>
                <div className="fs-7 text-muted">
                  Stock actual:{' '}
                  <span
                    className="fw-semibold"
                    style={{
                      color: targetInsumo.currentStock <= targetInsumo.minStock ? '#dc3545' : '#10b981'
                    }}
                  >
                    {targetInsumo.currentStock} {targetInsumo.unit}
                  </span>
                  {' '}· Mínimo: {targetInsumo.minStock} {targetInsumo.unit}
                </div>
              </div>
            </div>
          )}

          {/* Tipo de movimiento */}
          <div className="mb-3">
            <label className="form-label fs-7 fw-semibold text-dark">Tipo de Movimiento</label>
            <div className="d-flex gap-2">
              <button
                type="button"
                className={`btn flex-grow-1 ${isRestock ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                style={{ borderRadius: 8 }}
                onClick={() => setIsRestock(true)}
              >
                <i className="bi bi-box-arrow-in-down me-1" />
                Ingreso (RF-68)
              </button>
              <button
                type="button"
                className={`btn flex-grow-1 ${!isRestock ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                style={{ borderRadius: 8 }}
                onClick={() => setIsRestock(false)}
              >
                <i className="bi bi-box-arrow-up me-1" />
                Consumo / Ajuste (RF-69)
              </button>
            </div>
          </div>

          {/* Cantidad */}
          <div className="mb-4">
            <label className="form-label fs-7 fw-semibold text-dark">
              Cantidad ({targetInsumo?.unit}) *
            </label>
            <input
              type="number"
              step="0.5"
              min="0.1"
              className="form-control form-control-lg fw-bold text-center"
              required
              value={movementQty}
              style={{ borderRadius: 8 }}
              onChange={e => setMovementQty(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-light" onClick={() => setIsMovementModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-brand fw-semibold">
              <i className="bi bi-arrow-repeat me-1" />
              Registrar Movimiento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

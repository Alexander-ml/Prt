import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Insumo } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { StatCard } from '../components/common/StatCard';
import { SearchBar } from '../components/common/SearchBar';
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
      <PageHeader
        icon="bi-boxes"
        title="Inventario e Insumos"
        subtitle="Control de insumos disponibles, alertas de reposición y movimientos de stock."
        actions={
          <button
            className="btn-brand btn btn-sm fw-semibold"
            style={{ borderRadius: 8 }}
            onClick={() => handleOpenModal()}
          >
            <i className="bi bi-plus-lg me-1"></i> Registrar Insumo
          </button>
        }
      />

      <div className="row g-3 mb-4 stagger-children">
        <div className="col-12 col-sm-4">
          <StatCard
            title="Total Insumos"
            value={insumos.length}
            subtitle="Artículos registrados"
            icon="bi-boxes"
            colorTheme="indigo"
          />
        </div>
        <div className="col-12 col-sm-4">
          <StatCard
            title="Bajo Stock Mínimo"
            value={lowStockInsumos.length}
            subtitle="Requieren reposición inmediata"
            icon="bi-exclamation-triangle-fill"
            colorTheme="rose"
          />
        </div>
        <div className="col-12 col-sm-4">
          <StatCard
            title="Stock Suficiente"
            value={insumos.length - lowStockInsumos.length}
            subtitle="Niveles óptimos para servicio"
            icon="bi-shield-check"
            colorTheme="emerald"
          />
        </div>
      </div>

      {lowStockInsumos.length > 0 && (
        <div
          className="alert alert-danger rounded-3 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2"
          style={{ border: '1px solid #fca5a5' }}
        >
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-octagon-fill fs-5 text-danger flex-shrink-0"></i>
            <span style={{ fontSize: '0.875rem' }}>
              <strong>Alerta de Reposición Urgente</strong> —{' '}
              {lowStockInsumos.length} insumos están por debajo de su stock mínimo de seguridad.
            </span>
          </div>
          <div className="d-flex gap-1 flex-wrap">
            {lowStockInsumos.map(ins => (
              <span
                key={ins.id}
                className="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold"
                style={{ borderRadius: 99, fontSize: '0.72rem' }}
              >
                {ins.name}: {ins.currentStock} {ins.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      <SectionCard icon="bi-funnel" title="Filtros del Inventario" className="mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-5">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar insumo por nombre..."
            />
          </div>
          <div className="col-12 col-md-7 d-flex align-items-center justify-content-md-end gap-1 overflow-x-auto pb-1">
            <span className="fs-7 text-muted fw-semibold me-2 flex-shrink-0">Categoría:</span>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`btn btn-sm text-capitalize text-nowrap fw-semibold ${selectedCategory === cat ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                style={{ borderRadius: 8 }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard icon="bi-list-ul" title="Listado de Insumos e Ingredientes" noPadding>
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
                {filteredInsumos.length === 0 ? (
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
                  filteredInsumos.map(ins => {
                    const isLow = ins.currentStock <= ins.minStock;
                    const stockRatio = ins.minStock > 0 ? ins.currentStock / (ins.minStock * 2) : 1;
                    const pct = Math.min(100, Math.round(stockRatio * 100));
                    const fillClass = pct < 50 ? 'critical' : pct < 80 ? 'low' : 'ok';
                    const fillLabelColor = pct < 50 ? '#e11d48' : pct < 80 ? '#d97706' : '#059669';

                    return (
                      <tr key={ins.id}>
                        <td>
                          <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{ins.name}</div>
                        </td>
                        <td>
                          <span className="badge" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
                            {ins.category}
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
                            S/ {ins.costPerUnit.toFixed(2)}
                          </span>
                        </td>
                        <td style={{ minWidth: 130 }}>
                          <div className="stock-progress-bar mb-1">
                            <div
                              className={`stock-progress-fill ${fillClass}`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: fillLabelColor }}>
                            {pct}% del óptimo
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
                              className="btn-icon btn-icon-success"
                              title="Registrar Movimiento de Stock"
                              aria-label="Registrar Movimiento"
                              onClick={() => {
                                setTargetInsumo(ins);
                                setMovementQty(5);
                                setIsRestock(true);
                                setIsMovementModalOpen(true);
                              }}
                            >
                              <i className="bi bi-arrow-down-up"></i>
                            </button>
                            <button
                              className="btn-icon btn-icon-primary"
                              title="Editar Insumo"
                              aria-label="Editar Insumo"
                              onClick={() => handleOpenModal(ins)}
                            >
                              <i className="bi bi-pencil-fill"></i>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInsumo ? 'Editar Insumo' : 'Registrar Nuevo Insumo'}
        subtitle="Agrega o modifica insumos e ingredientes del catálogo."
      >
        <form onSubmit={handleSubmitInsumo}>
          <div className="mb-3">
            <label className="form-label">Nombre del Insumo *</label>
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
                Ingreso
              </button>
              <button
                type="button"
                className={`btn flex-grow-1 ${!isRestock ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                style={{ borderRadius: 8 }}
                onClick={() => setIsRestock(false)}
              >
                <i className="bi bi-box-arrow-up me-1" />
                Consumo / Ajuste
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

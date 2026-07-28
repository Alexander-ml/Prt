import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Insumo } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';

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
    <div className="container-fluid p-0">
      {/* Header Title */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold text-dark mb-1">
            <i className="bi bi-boxes text-primary me-2"></i>
            Gestión de Inventario y Stock de Insumos
          </h4>
          <p className="text-muted fs-7 mb-0">
            Control de insumos disponibles, alertas de reposición e ingresos/consumos (RF-66 - RF-72).
          </p>
        </div>
        <button className="btn btn-brand btn-md fw-semibold shadow-sm" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus-lg me-1.5"></i> Registrar Insumo (RF-66)
        </button>
      </div>

      {/* Low Stock Alerts Banner (RF-72) */}
      {lowStockInsumos.length > 0 && (
        <div className="alert alert-danger bg-danger-subtle border-danger-subtle text-danger-emphasis rounded-3 p-3 mb-4 shadow-sm">
          <div className="d-flex align-items-center gap-2 mb-1">
            <i className="bi bi-exclamation-octagon-fill fs-5 text-danger"></i>
            <strong className="fs-6">Alerta de Insumos con Disponibilidad Baja (RF-72)</strong>
          </div>
          <p className="fs-7 mb-2">Los siguientes insumos requieren reposición urgente para evitar quiebres de stock en cocina:</p>
          <div className="d-flex flex-wrap gap-2">
            {lowStockInsumos.map(ins => (
              <span key={ins.id} className="badge bg-danger text-white fs-7 px-3 py-1.5 rounded-pill">
                {ins.name}: {ins.currentStock} {ins.unit} (Mín: {ins.minStock} {ins.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search & Category Filter Card (RF-70) */}
      <div className="card glass-card border-0 mb-4 p-3">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar insumo por nombre (RF-70)..."
            />
          </div>
          <div className="col-12 col-md-6 d-flex align-items-center justify-content-md-end gap-2">
            <label className="fs-7 text-muted fw-semibold me-1">Categoría de Insumo:</label>
            <select
              className="form-select form-select-sm w-auto rounded-3 border-secondary-subtle fw-medium shadow-none"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="todas">Todas las Categorías</option>
              <option value="Carnes">Carnes</option>
              <option value="Mariscos">Mariscos</option>
              <option value="Licores">Licores</option>
              <option value="Abarrotes">Abarrotes</option>
              <option value="Lácteos">Lácteos</option>
              <option value="Verduras">Verduras</option>
            </select>
          </div>
        </div>
      </div>

      {/* Insumos Data Table (RF-71) */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Nombre del Insumo</th>
              <th>Categoría</th>
              <th>Stock Actual (RF-71)</th>
              <th>Stock Mínimo</th>
              <th>Costo Aprox. Un.</th>
              <th>Última Reposición</th>
              <th>Estado Stock</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredInsumos.map(ins => {
              const isLow = ins.currentStock <= ins.minStock;

              return (
                <tr key={ins.id}>
                  <td>
                    <div className="fw-bold text-dark">{ins.name}</div>
                  </td>
                  <td>
                    <span className="badge bg-secondary-subtle text-secondary">{ins.category}</span>
                  </td>
                  <td>
                    <span className={`fw-bold fs-6 ${isLow ? 'text-danger' : 'text-dark'}`}>
                      {ins.currentStock} {ins.unit}
                    </span>
                  </td>
                  <td><span className="text-muted">{ins.minStock} {ins.unit}</span></td>
                  <td>S/ {ins.costPerUnit.toFixed(2)} / {ins.unit}</td>
                  <td><small className="text-muted">{ins.lastRestockDate}</small></td>
                  <td>
                    <Badge
                      status={isLow ? 'STOCK BAJO' : 'OK'}
                      variant={isLow ? 'danger' : 'success'}
                    />
                  </td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-1">
                      <button
                        className="btn btn-sm btn-light border text-success"
                        title="Registrar Ingreso/Ajuste (RF-68, RF-69)"
                        onClick={() => {
                          setTargetInsumo(ins);
                          setMovementQty(5);
                          setIsRestock(true);
                          setIsMovementModalOpen(true);
                        }}
                      >
                        <i className="bi bi-box-arrow-in-down"></i> Movimiento
                      </button>

                      <button
                        className="btn btn-sm btn-light border text-primary"
                        title="Editar Insumo (RF-67)"
                        onClick={() => handleOpenModal(ins)}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Insumo Modal (RF-66, RF-67) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInsumo ? 'Editar Insumo (RF-67)' : 'Registrar Nuevo Insumo (RF-66)'}
      >
        <form onSubmit={handleSubmitInsumo}>
          <div className="mb-3">
            <label className="form-label fs-7 fw-semibold text-dark">Nombre del Insumo *</label>
            <input
              type="text"
              className="form-control rounded-3"
              placeholder="Ej. Lomo Fino de Res"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label fs-7 fw-semibold text-dark">Unidad de Medida *</label>
              <select
                className="form-select rounded-3"
                value={formData.unit}
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
                className="form-select rounded-3"
                value={formData.category}
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

          <div className="row g-3 mb-4">
            <div className="col-4">
              <label className="form-label fs-7 fw-semibold text-dark">Stock Inicial</label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="form-control rounded-3"
                required
                value={formData.currentStock}
                onChange={e => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="col-4">
              <label className="form-label fs-7 fw-semibold text-dark">Stock Mínimo</label>
              <input
                type="number"
                min="1"
                step="0.5"
                className="form-control rounded-3"
                required
                value={formData.minStock}
                onChange={e => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 1 })}
              />
            </div>
            <div className="col-4">
              <label className="form-label fs-7 fw-semibold text-dark">Costo Un. (S/)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="form-control rounded-3"
                required
                value={formData.costPerUnit}
                onChange={e => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-2">
            <button type="button" className="btn btn-light" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-brand fw-semibold">Guardar Insumo</button>
          </div>
        </form>
      </Modal>

      {/* Movement Modal (RF-68, RF-69) */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title={`Movimiento de Stock: ${targetInsumo?.name}`}
      >
        <form onSubmit={handleMovementSubmit}>
          <div className="mb-3">
            <label className="form-label fs-7 fw-semibold text-dark">Tipo de Movimiento</label>
            <div className="d-flex gap-2">
              <button
                type="button"
                className={`btn flex-grow-1 ${isRestock ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                onClick={() => setIsRestock(true)}
              >
                <i className="bi bi-box-arrow-in-down me-1"></i> Ingreso de Reposición (RF-68)
              </button>
              <button
                type="button"
                className={`btn flex-grow-1 ${!isRestock ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                onClick={() => setIsRestock(false)}
              >
                <i className="bi bi-box-arrow-up me-1"></i> Consumo / Ajuste (RF-69)
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fs-7 fw-semibold text-dark">Cantidad ({targetInsumo?.unit}) *</label>
            <input
              type="number"
              step="0.5"
              min="0.1"
              className="form-control form-control-lg rounded-3 fw-bold text-center"
              required
              value={movementQty}
              onChange={e => setMovementQty(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="d-flex justify-content-end gap-2 border-top pt-2">
            <button type="button" className="btn btn-light" onClick={() => setIsMovementModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-brand fw-semibold">Registrar Movimiento</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

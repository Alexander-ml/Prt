import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SectionCard } from '../common/SectionCard';
import { EmptyState } from '../common/EmptyState';
import { formatMoney } from '../../utils/money';

export const SuppliersView: React.FC = () => {
  const { suppliers, insumos, supplierPriceHistory, addSupplier, updateSupplier, toggleSupplierActive, addSupplierPriceHistory } = useApp();
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<{ id: string; name: string; contactName?: string; phone?: string; email?: string; address?: string; ruc?: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    ruc: ''
  });
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [priceHistoryInsumoId, setPriceHistoryInsumoId] = useState('');
  const [priceHistoryCost, setPriceHistoryCost] = useState('');
  const [showPriceForm, setShowPriceForm] = useState(false);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.contactName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (s.ruc?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesActive = !activeOnly || s.active;
      return matchesSearch && matchesActive;
    });
  }, [suppliers, search, activeOnly]);

  const supplierHistory = useMemo(() => {
    if (!selectedSupplierId) return [];
    return supplierPriceHistory.filter(p => p.supplierId === selectedSupplierId).slice(0, 50);
  }, [supplierPriceHistory, selectedSupplierId]);

  const openCreate = () => {
    setEditingSupplier(null);
    setFormData({ name: '', contactName: '', phone: '', email: '', address: '', ruc: '' });
    setIsModalOpen(true);
  };

  const openEdit = (supplier: typeof suppliers[0]) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      ruc: supplier.ruc || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmitSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name: formData.name,
        contactName: formData.contactName || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        ruc: formData.ruc || undefined
      });
    } else {
      addSupplier({
        name: formData.name,
        contactName: formData.contactName || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        ruc: formData.ruc || undefined,
        active: true
      });
    }
    setIsModalOpen(false);
  };

  const handleAddPriceHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || !priceHistoryInsumoId || !priceHistoryCost) return;
    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    const insumo = insumos.find(i => i.id === priceHistoryInsumoId);
    if (!supplier || !insumo) return;
    addSupplierPriceHistory({
      supplierId: supplier.id,
      supplierName: supplier.name,
      insumoId: insumo.id,
      insumoName: insumo.name,
      costPerUnit: parseFloat(priceHistoryCost)
    });
    setPriceHistoryInsumoId('');
    setPriceHistoryCost('');
    setShowPriceForm(false);
  };

  return (
    <div className="animate-fadeinup">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <input
            type="text"
            className="form-control"
            style={{ minWidth: 220, borderRadius: 8 }}
            placeholder="Buscar proveedor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="form-check form-switch">
            <input className="form-check-input" type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} />
            <label className="form-check-label">Solo activos</label>
          </div>
        </div>
        <button className="btn btn-brand fw-semibold" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1" />
          Nuevo Proveedor
        </button>
      </div>

      <div className="row g-3">
        <div className="col-lg-5">
          <SectionCard icon="bi-truck" title="Proveedores" noPadding>
            <div className="table-responsive-x">
              <div className="custom-table-container">
                <table className="custom-table" style={{ minWidth: 500 }}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Contacto</th>
                      <th>RUC</th>
                      <th>Estado</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4">
                          <EmptyState
                            icon="bi-truck"
                            title="Sin proveedores"
                            description="Registra el primer proveedor para comenzar."
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredSuppliers.map(s => (
                        <tr key={s.id} style={{ cursor: 'pointer', background: selectedSupplierId === s.id ? 'var(--bs-secondary-bg, #f8f9fa)' : undefined }} onClick={() => setSelectedSupplierId(s.id)}>
                          <td>
                            <div className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.address || '-'}</div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{s.contactName || '-'}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{s.ruc || '-'}</td>
                          <td>
                            <span className={`badge ${s.active ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} border`} style={{ borderRadius: 99, fontSize: '0.72rem' }}>
                              {s.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex justify-content-end gap-1">
                              <button type="button" className="btn-icon btn-icon-primary" title="Editar" onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
                                <i className="bi bi-pencil-fill" />
                              </button>
                              <button type="button" className={`btn-icon ${s.active ? 'btn-icon-warning' : 'btn-icon-success'}`} title={s.active ? 'Desactivar' : 'Activar'} onClick={(e) => { e.stopPropagation(); toggleSupplierActive(s.id); }}>
                                <i className={`bi ${s.active ? 'bi-pause-circle' : 'bi-play-circle'}`} />
                              </button>
                            </div>
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

        <div className="col-lg-7">
          {selectedSupplierId ? (
            <SectionCard icon="bi-receipt" title="Historial de Costos" noPadding>
              <div className="p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <div className="fw-semibold">{suppliers.find(s => s.id === selectedSupplierId)?.name}</div>
                  <div className="text-muted fs-7">Evolución de precios por insumo</div>
                </div>
                <button className="btn btn-outline-brand btn-sm" onClick={() => setShowPriceForm(!showPriceForm)}>
                  <i className="bi bi-plus-lg me-1" />
                  Registrar Costo
                </button>
              </div>
              {showPriceForm && (
                <form className="p-3 border-top bg-light" onSubmit={handleAddPriceHistory}>
                  <div className="row g-2 align-items-end">
                    <div className="col-sm-5">
                      <label className="form-label fs-7 fw-semibold">Insumo</label>
                      <select className="form-select" value={priceHistoryInsumoId} onChange={e => setPriceHistoryInsumoId(e.target.value)} required>
                        <option value="">Seleccione</option>
                        {insumos.map(i => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-sm-3">
                      <label className="form-label fs-7 fw-semibold">Costo (S/)</label>
                      <input type="number" step="0.01" className="form-control" value={priceHistoryCost} onChange={e => setPriceHistoryCost(e.target.value)} required />
                    </div>
                    <div className="col-sm-2">
                      <button type="submit" className="btn btn-brand w-100">Guardar</button>
                    </div>
                  </div>
                </form>
              )}
              <div className="table-responsive-x">
                <div className="custom-table-container">
                  <table className="custom-table" style={{ minWidth: 400 }}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Insumo</th>
                        <th>Costo Unitario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierHistory.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-4 text-muted">Sin registros de costo.</td>
                        </tr>
                      ) : (
                        supplierHistory.map(h => (
                          <tr key={h.id}>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{h.recordedAt}</td>
                            <td className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{h.insumoName}</td>
                            <td className="fw-bold" style={{ color: 'var(--text-secondary)' }}>{formatMoney(h.costPerUnit)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard icon="bi-truck" title="Historial de Costos" noPadding>
              <div className="p-5 text-center text-muted">
                <i className="bi bi-arrow-left fs-3 mb-2 d-block" />
                Selecciona un proveedor de la lista para ver su historial de costos.
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h5>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)} />
              </div>
              <form onSubmit={handleSubmitSupplier}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Nombre *</label>
                    <input type="text" className="form-control" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Contacto</label>
                    <input type="text" className="form-control" value={formData.contactName} onChange={e => setFormData(prev => ({ ...prev, contactName: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Teléfono</label>
                    <input type="text" className="form-control" value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email</label>
                    <input type="email" className="form-control" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Dirección</label>
                    <input type="text" className="form-control" value={formData.address} onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">RUC</label>
                    <input type="text" className="form-control" value={formData.ruc} onChange={e => setFormData(prev => ({ ...prev, ruc: e.target.value }))} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-brand fw-semibold">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
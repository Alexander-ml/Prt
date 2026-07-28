import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Promotion, Tax } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const ConfigPage: React.FC = () => {
  const {
    restaurantInfo,
    updateRestaurantInfo,
    taxes,
    addTax,
    updateTax,
    promotions,
    addPromotion,
    updatePromotion,
    togglePromotionActive,
    categories,
    dishes,
    currentRole
  } = useApp();

  const isAdmin = currentRole === 'Administrador';

  const [activeTab, setActiveTab] = useState<'info' | 'impuestos' | 'promociones'>('info');

  // Restaurant Info Form State (RF-17, RF-18, RF-19)
  const [infoForm, setInfoForm] = useState({ ...restaurantInfo });

  // Tax Modal State (RF-20, RF-21)
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [taxFormData, setTaxFormData] = useState({ name: '', percentage: 18, active: true });

  // Promotion Modal State (RF-22, RF-23)
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [promoFormData, setPromoFormData] = useState({
    code: '',
    name: '',
    type: 'total' as 'dish' | 'category' | 'total',
    targetId: '',
    discountPercentage: 10,
    active: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31'
  });

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRestaurantInfo(infoForm);
  };

  const handleTaxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTax) {
      updateTax(editingTax.id, taxFormData);
    } else {
      addTax(taxFormData.name, Number(taxFormData.percentage));
    }
    setIsTaxModalOpen(false);
  };

  const handleOpenTaxModal = (tax?: Tax) => {
    if (tax) {
      setEditingTax(tax);
      setTaxFormData({ name: tax.name, percentage: tax.percentage, active: tax.active });
    } else {
      setEditingTax(null);
      setTaxFormData({ name: '', percentage: 18, active: true });
    }
    setIsTaxModalOpen(true);
  };

  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let targetName = 'Cuenta Total';
    if (promoFormData.type === 'category') {
      targetName = categories.find(c => c.id === promoFormData.targetId)?.name || 'Categoría';
    } else if (promoFormData.type === 'dish') {
      targetName = dishes.find(d => d.id === promoFormData.targetId)?.name || 'Plato';
    }

    if (editingPromo) {
      updatePromotion(editingPromo.id, {
        ...promoFormData,
        targetName
      });
    } else {
      addPromotion({
        ...promoFormData,
        targetName
      });
    }
    setIsPromoModalOpen(false);
  };

  const handleOpenPromoModal = (promo?: Promotion) => {
    if (promo) {
      setEditingPromo(promo);
      setPromoFormData({
        code: promo.code,
        name: promo.name,
        type: promo.type,
        targetId: promo.targetId || '',
        discountPercentage: promo.discountPercentage,
        active: promo.active,
        startDate: promo.startDate,
        endDate: promo.endDate
      });
    } else {
      setEditingPromo(null);
      setPromoFormData({
        code: `DESC${Math.floor(10 + Math.random() * 90)}`,
        name: '',
        type: 'total',
        targetId: '',
        discountPercentage: 10,
        active: true,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2026-12-31'
      });
    }
    setIsPromoModalOpen(true);
  };

  return (
    <div className="container-fluid p-0">
      {/* Page Header */}
      <PageHeader
        icon="bi-sliders"
        title="Configuración General del Sistema"
        subtitle="Parámetros comerciales, impuestos, promociones y datos operativos del establecimiento."
      />

      {/* Navigation Tabs */}
      <div className="d-flex align-items-center gap-2 mb-4">
        <button
          className={`btn btn-sm fw-semibold ${activeTab === 'info' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
          style={{ borderRadius: 8 }}
          onClick={() => setActiveTab('info')}
        >
          <i className="bi bi-building me-1.5"></i> Datos del Local
        </button>
        <button
          className={`btn btn-sm fw-semibold ${activeTab === 'impuestos' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
          style={{ borderRadius: 8 }}
          onClick={() => setActiveTab('impuestos')}
        >
          <i className="bi bi-percent me-1.5"></i> Impuestos
        </button>
        <button
          className={`btn btn-sm fw-semibold ${activeTab === 'promociones' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
          style={{ borderRadius: 8 }}
          onClick={() => setActiveTab('promociones')}
        >
          <i className="bi bi-ticket-perforated-fill me-1.5"></i> Promociones
        </button>
      </div>

      {/* Tab 1: Info */}
      {activeTab === 'info' && (
        <SectionCard icon="bi-building" title="Información del Establecimiento" className="mb-4">
          <form onSubmit={handleInfoSubmit}>
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Nombre del Restaurante *</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: 8 }}
                  disabled={!isAdmin}
                  required
                  value={infoForm.name}
                  onChange={e => setInfoForm({ ...infoForm, name: e.target.value })}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">RUC / Identificación Fiscal *</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: 8 }}
                  disabled={!isAdmin}
                  required
                  value={infoForm.taxId}
                  onChange={e => setInfoForm({ ...infoForm, taxId: e.target.value })}
                />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Teléfono de Contacto</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: 8 }}
                  disabled={!isAdmin}
                  value={infoForm.phone}
                  onChange={e => setInfoForm({ ...infoForm, phone: e.target.value })}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="form-control"
                  style={{ borderRadius: 8 }}
                  disabled={!isAdmin}
                  value={infoForm.email}
                  onChange={e => setInfoForm({ ...infoForm, email: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Dirección Física</label>
              <input
                type="text"
                className="form-control"
                style={{ borderRadius: 8 }}
                disabled={!isAdmin}
                value={infoForm.address}
                onChange={e => setInfoForm({ ...infoForm, address: e.target.value })}
              />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-md-8">
                <label className="form-label">Horario de Atención</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: 8 }}
                  disabled={!isAdmin}
                  value={infoForm.openingHours}
                  onChange={e => setInfoForm({ ...infoForm, openingHours: e.target.value })}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label">Moneda Principal</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: 8 }}
                  disabled={!isAdmin}
                  value={infoForm.currency}
                  onChange={e => setInfoForm({ ...infoForm, currency: e.target.value })}
                />
              </div>
            </div>

            {isAdmin && (
              <div className="d-flex justify-content-end pt-3 border-top">
                <button type="submit" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }}>
                  <i className="bi bi-check2-circle me-1.5"></i> Guardar Cambios de Configuración
                </button>
              </div>
            )}
          </form>
        </SectionCard>
      )}

      {/* Tab 2: Impuestos */}
      {activeTab === 'impuestos' && (
        <SectionCard
          icon="bi-percent"
          title="Impuestos Aplicables a las Ventas"
          noPadding
          actions={
            isAdmin && (
              <button className="btn-brand btn btn-sm fw-semibold" style={{ borderRadius: 8 }} onClick={() => handleOpenTaxModal()}>
                <i className="bi bi-plus-lg me-1"></i> Registrar Impuesto
              </button>
            )
          }
        >
          <div className="table-responsive-x">
            <div className="custom-table-container">
              <table className="custom-table" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th>Nombre del Impuesto</th>
                    <th>Porcentaje (%)</th>
                    <th>Estado</th>
                    {isAdmin && <th className="text-end">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {taxes.map(tax => (
                    <tr key={tax.id}>
                      <td><div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{tax.name}</div></td>
                      <td><span className="fw-bold fs-6" style={{ color: 'var(--color-brand)' }}>{tax.percentage}%</span></td>
                      <td>
                        <Badge
                          status={tax.active ? 'Activo en Ventas' : 'Desactivado'}
                          variant={tax.active ? 'success' : 'secondary'}
                        />
                      </td>
                      {isAdmin && (
                        <td className="text-end">
                          <button
                            className="btn-icon btn-icon-primary"
                            title="Editar o Desactivar Impuesto"
                            onClick={() => handleOpenTaxModal(tax)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Tab 3: Promociones */}
      {activeTab === 'promociones' && (
        <SectionCard
          icon="bi-ticket-perforated-fill"
          title="Promociones y Descuentos Vigentes"
          subtitle="Descuentos aplicables durante la liquidación de cuenta en Ventas."
          noPadding
          actions={
            isAdmin && (
              <button className="btn-brand btn btn-sm fw-semibold" style={{ borderRadius: 8 }} onClick={() => handleOpenPromoModal()}>
                <i className="bi bi-plus-lg me-1"></i> Crear Promoción
              </button>
            )
          }
        >
          <div className="table-responsive-x">
            <div className="custom-table-container">
              <table className="custom-table" style={{ minWidth: 650 }}>
                <thead>
                  <tr>
                    <th>Código & Nombre</th>
                    <th>Alcance</th>
                    <th>Descuento</th>
                    <th>Vigencia</th>
                    <th>Estado</th>
                    {isAdmin && <th className="text-end">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {promotions.map(promo => (
                    <tr key={promo.id}>
                      <td>
                        <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{promo.name}</div>
                        <span className="badge font-monospace fs-8" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
                          {promo.code}
                        </span>
                      </td>
                      <td>
                        <span className="text-capitalize fw-semibold" style={{ color: 'var(--text-secondary)' }}>
                          {promo.type === 'total' ? 'Cuenta Total' : `${promo.type}: ${promo.targetName || ''}`}
                        </span>
                      </td>
                      <td>
                        <span className="fw-bold fs-6" style={{ color: 'var(--color-emerald)' }}>{promo.discountPercentage}% OFF</span>
                      </td>
                      <td>
                        <small style={{ color: 'var(--text-muted)' }}>{promo.startDate} al {promo.endDate}</small>
                      </td>
                      <td>
                        <Badge
                          status={promo.active ? 'Vigente' : 'Inactiva'}
                          variant={promo.active ? 'success' : 'secondary'}
                        />
                      </td>
                      {isAdmin && (
                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            <button
                              className="btn-icon btn-icon-primary"
                              title="Editar Promoción"
                              onClick={() => handleOpenPromoModal(promo)}
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                            <button
                              className={`btn-icon ${promo.active ? 'btn-icon-danger' : 'btn-icon-success'}`}
                              title={promo.active ? 'Desactivar Promoción' : 'Activar Promoción'}
                              onClick={() => togglePromotionActive(promo.id)}
                            >
                              <i className={`bi ${promo.active ? 'bi-slash-circle' : 'bi-check-circle-fill'}`}></i>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Tax Modal */}
      <Modal
        isOpen={isTaxModalOpen}
        onClose={() => setIsTaxModalOpen(false)}
        title={editingTax ? 'Editar Impuesto' : 'Registrar Impuesto'}
      >
        <form onSubmit={handleTaxSubmit}>
          <div className="mb-3">
            <label className="form-label">Nombre del Impuesto *</label>
            <input
              type="text"
              className="form-control"
              style={{ borderRadius: 8 }}
              placeholder="Ej. IGV (18%)"
              required
              value={taxFormData.name}
              onChange={e => setTaxFormData({ ...taxFormData, name: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Porcentaje (%) *</label>
            <input
              type="number"
              step="0.1"
              min="0"
              className="form-control"
              style={{ borderRadius: 8 }}
              required
              value={taxFormData.percentage}
              onChange={e => setTaxFormData({ ...taxFormData, percentage: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="form-check form-switch mb-4">
            <input
              className="form-check-input"
              type="checkbox"
              id="taxActiveSwitch"
              checked={taxFormData.active}
              onChange={e => setTaxFormData({ ...taxFormData, active: e.target.checked })}
            />
            <label className="form-check-label fw-semibold" htmlFor="taxActiveSwitch" style={{ color: 'var(--text-primary)' }}>
              Impuesto Activo en Cálculo de Ventas
            </label>
          </div>
          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setIsTaxModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }}>
              Guardar Impuesto
            </button>
          </div>
        </form>
      </Modal>

      {/* Promotion Modal */}
      <Modal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        title={editingPromo ? 'Editar Promoción' : 'Registrar Promoción'}
      >
        <form onSubmit={handlePromoSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-8">
              <label className="form-label">Nombre de Promoción *</label>
              <input
                type="text"
                className="form-control"
                style={{ borderRadius: 8 }}
                placeholder="Ej. Happy Hour Cócteles"
                required
                value={promoFormData.name}
                onChange={e => setPromoFormData({ ...promoFormData, name: e.target.value })}
              />
            </div>
            <div className="col-4">
              <label className="form-label">Código *</label>
              <input
                type="text"
                className="form-control font-monospace"
                style={{ borderRadius: 8 }}
                required
                value={promoFormData.code}
                onChange={e => setPromoFormData({ ...promoFormData, code: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label">Alcance del Descuento *</label>
              <select
                className="form-select"
                style={{ borderRadius: 8 }}
                value={promoFormData.type}
                onChange={e => setPromoFormData({ ...promoFormData, type: e.target.value as any })}
              >
                <option value="total">Cuenta Total de Mesa</option>
                <option value="category">Por Categoría de Platos</option>
                <option value="dish">Por Plato Específico</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label">Descuento (%) *</label>
              <input
                type="number"
                min="1"
                max="100"
                className="form-control"
                style={{ borderRadius: 8 }}
                required
                value={promoFormData.discountPercentage}
                onChange={e => setPromoFormData({ ...promoFormData, discountPercentage: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {promoFormData.type === 'category' && (
            <div className="mb-3">
              <label className="form-label">Seleccionar Categoría Target</label>
              <select
                className="form-select"
                style={{ borderRadius: 8 }}
                value={promoFormData.targetId}
                onChange={e => setPromoFormData({ ...promoFormData, targetId: e.target.value })}
              >
                <option value="">Seleccione categoría...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {promoFormData.type === 'dish' && (
            <div className="mb-3">
              <label className="form-label">Seleccionar Plato Target</label>
              <select
                className="form-select"
                style={{ borderRadius: 8 }}
                value={promoFormData.targetId}
                onChange={e => setPromoFormData({ ...promoFormData, targetId: e.target.value })}
              >
                <option value="">Seleccione plato...</option>
                {dishes.map(d => <option key={d.id} value={d.id}>{d.name} (S/ {d.price})</option>)}
              </select>
            </div>
          )}

          <div className="row g-3 mb-4">
            <div className="col-6">
              <label className="form-label">Fecha Inicio</label>
              <input
                type="date"
                className="form-control"
                style={{ borderRadius: 8 }}
                value={promoFormData.startDate}
                onChange={e => setPromoFormData({ ...promoFormData, startDate: e.target.value })}
              />
            </div>
            <div className="col-6">
              <label className="form-label">Fecha Fin</label>
              <input
                type="date"
                className="form-control"
                style={{ borderRadius: 8 }}
                value={promoFormData.endDate}
                onChange={e => setPromoFormData({ ...promoFormData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setIsPromoModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }}>
              Guardar Promoción
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

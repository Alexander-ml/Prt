import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Promotion, Tax } from '../types';
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
      {/* Title & Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold text-dark mb-1">
            <i className="bi bi-sliders text-primary me-2"></i>
            Configuración General del Restaurante
          </h4>
          <p className="text-muted fs-7 mb-0">
            Parámetros comerciales, impuestos, promociones y datos operativos (RF-17 - RF-24).
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4 border-bottom">
        <li className="nav-item">
          <button
            className={`nav-link fw-semibold px-4 py-2.5 ${activeTab === 'info' ? 'active text-primary border-primary border-bottom-0' : 'text-muted'}`}
            onClick={() => setActiveTab('info')}
          >
            <i className="bi bi-building me-2"></i> Datos del Local (RF-17 - RF-19)
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-semibold px-4 py-2.5 ${activeTab === 'impuestos' ? 'active text-primary border-primary border-bottom-0' : 'text-muted'}`}
            onClick={() => setActiveTab('impuestos')}
          >
            <i className="bi bi-percent me-2"></i> Impuestos (RF-20 - RF-21)
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-semibold px-4 py-2.5 ${activeTab === 'promociones' ? 'active text-primary border-primary border-bottom-0' : 'text-muted'}`}
            onClick={() => setActiveTab('promociones')}
          >
            <i className="bi bi-ticket-perforated-fill me-2"></i> Promociones (RF-22 - RF-24)
          </button>
        </li>
      </ul>

      {/* Tab 1: Info (RF-17, RF-18, RF-19) */}
      {activeTab === 'info' && (
        <div className="card glass-card border-0 p-4" style={{ maxWidth: 800 }}>
          <h6 className="fw-bold text-dark mb-3 border-bottom pb-2">Información del Establecimiento</h6>
          <form onSubmit={handleInfoSubmit}>
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6">
                <label className="form-label fs-7 fw-semibold text-dark">Nombre del Restaurante *</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  disabled={!isAdmin}
                  required
                  value={infoForm.name}
                  onChange={e => setInfoForm({ ...infoForm, name: e.target.value })}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fs-7 fw-semibold text-dark">RUC / Identificación Fiscal *</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  disabled={!isAdmin}
                  required
                  value={infoForm.taxId}
                  onChange={e => setInfoForm({ ...infoForm, taxId: e.target.value })}
                />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6">
                <label className="form-label fs-7 fw-semibold text-dark">Teléfono de Contacto</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  disabled={!isAdmin}
                  value={infoForm.phone}
                  onChange={e => setInfoForm({ ...infoForm, phone: e.target.value })}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fs-7 fw-semibold text-dark">Correo Electrónico</label>
                <input
                  type="email"
                  className="form-control rounded-3"
                  disabled={!isAdmin}
                  value={infoForm.email}
                  onChange={e => setInfoForm({ ...infoForm, email: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fs-7 fw-semibold text-dark">Dirección Física</label>
              <input
                type="text"
                className="form-control rounded-3"
                disabled={!isAdmin}
                value={infoForm.address}
                onChange={e => setInfoForm({ ...infoForm, address: e.target.value })}
              />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-md-8">
                <label className="form-label fs-7 fw-semibold text-dark">Horario de Atención (RF-19)</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  disabled={!isAdmin}
                  value={infoForm.openingHours}
                  onChange={e => setInfoForm({ ...infoForm, openingHours: e.target.value })}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fs-7 fw-semibold text-dark">Moneda Principal</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  disabled={!isAdmin}
                  value={infoForm.currency}
                  onChange={e => setInfoForm({ ...infoForm, currency: e.target.value })}
                />
              </div>
            </div>

            {isAdmin && (
              <div className="d-flex justify-content-end pt-3 border-top">
                <button type="submit" className="btn btn-brand fw-semibold">
                  <i className="bi bi-check2-circle me-1.5"></i> Guardar Cambios de Configuración
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 2: Impuestos (RF-20, RF-21) */}
      {activeTab === 'impuestos' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold text-dark mb-0">Impuestos Aplicables a las Ventas</h6>
            {isAdmin && (
              <button className="btn btn-brand btn-sm fw-semibold" onClick={() => handleOpenTaxModal()}>
                <i className="bi bi-plus-lg me-1"></i> Registrar Impuesto
              </button>
            )}
          </div>
          <div className="custom-table-container">
            <table className="custom-table">
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
                    <td><div className="fw-bold text-dark">{tax.name}</div></td>
                    <td><span className="fw-bold text-primary fs-6">{tax.percentage}%</span></td>
                    <td>
                      <Badge
                        status={tax.active ? 'Activo en Ventas' : 'Desactivado'}
                        variant={tax.active ? 'success' : 'secondary'}
                      />
                    </td>
                    {isAdmin && (
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-light border text-primary"
                          title="Editar/Desactivar Impuesto (RF-21)"
                          onClick={() => handleOpenTaxModal(tax)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Promociones (RF-22, RF-23, RF-24) */}
      {activeTab === 'promociones' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 className="fw-bold text-dark mb-0">Promociones y Descuentos Vigentes (RF-24)</h6>
              <small className="text-muted">Descuentos aplicables durante la liquidación de cuenta en Ventas.</small>
            </div>
            {isAdmin && (
              <button className="btn btn-brand btn-sm fw-semibold" onClick={() => handleOpenPromoModal()}>
                <i className="bi bi-plus-lg me-1"></i> Crear Promoción (RF-22)
              </button>
            )}
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
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
                      <div className="fw-bold text-dark">{promo.name}</div>
                      <span className="badge bg-secondary-subtle text-secondary font-monospace fs-8">
                        {promo.code}
                      </span>
                    </td>
                    <td>
                      <span className="text-capitalize fw-semibold text-secondary">
                        {promo.type === 'total' ? 'Cuenta Total' : `${promo.type}: ${promo.targetName || ''}`}
                      </span>
                    </td>
                    <td>
                      <span className="fw-bold text-emerald-600 fs-6">{promo.discountPercentage}% OFF</span>
                    </td>
                    <td>
                      <small className="text-muted">{promo.startDate} al {promo.endDate}</small>
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
                            className="btn btn-sm btn-light border text-primary"
                            title="Editar Promoción (RF-23)"
                            onClick={() => handleOpenPromoModal(promo)}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            className={`btn btn-sm ${promo.active ? 'btn-light text-danger' : 'btn-light text-success'} border`}
                            title={promo.active ? 'Desactivar Promoción (RF-23)' : 'Activar Promoción'}
                            onClick={() => togglePromotionActive(promo.id)}
                          >
                            <i className={`bi ${promo.active ? 'bi-slash-circle' : 'bi-check-circle'}`}></i>
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
      )}

      {/* Tax Modal (RF-20, RF-21) */}
      <Modal
        isOpen={isTaxModalOpen}
        onClose={() => setIsTaxModalOpen(false)}
        title={editingTax ? 'Editar Impuesto (RF-21)' : 'Registrar Impuesto (RF-20)'}
      >
        <form onSubmit={handleTaxSubmit}>
          <div className="mb-3">
            <label className="form-label fs-7 fw-semibold text-dark">Nombre del Impuesto *</label>
            <input
              type="text"
              className="form-control rounded-3"
              placeholder="Ej. IGV (18%)"
              required
              value={taxFormData.name}
              onChange={e => setTaxFormData({ ...taxFormData, name: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label fs-7 fw-semibold text-dark">Porcentaje (%) *</label>
            <input
              type="number"
              step="0.1"
              min="0"
              className="form-control rounded-3"
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
            <label className="form-check-label fs-7 text-dark fw-semibold" htmlFor="taxActiveSwitch">
              Impuesto Activo en Cálculo de Ventas
            </label>
          </div>
          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-light fw-medium" onClick={() => setIsTaxModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-brand fw-semibold">
              Guardar Impuesto
            </button>
          </div>
        </form>
      </Modal>

      {/* Promotion Modal (RF-22, RF-23) */}
      <Modal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        title={editingPromo ? 'Editar Promoción (RF-23)' : 'Registrar Promoción (RF-22)'}
      >
        <form onSubmit={handlePromoSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-8">
              <label className="form-label fs-7 fw-semibold text-dark">Nombre de Promoción *</label>
              <input
                type="text"
                className="form-control rounded-3"
                placeholder="Ej. Happy Hour Cócteles"
                required
                value={promoFormData.name}
                onChange={e => setPromoFormData({ ...promoFormData, name: e.target.value })}
              />
            </div>
            <div className="col-4">
              <label className="form-label fs-7 fw-semibold text-dark">Código *</label>
              <input
                type="text"
                className="form-control rounded-3 font-monospace"
                required
                value={promoFormData.code}
                onChange={e => setPromoFormData({ ...promoFormData, code: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label fs-7 fw-semibold text-dark">Alcance del Descuento *</label>
              <select
                className="form-select rounded-3"
                value={promoFormData.type}
                onChange={e => setPromoFormData({ ...promoFormData, type: e.target.value as any })}
              >
                <option value="total">Cuenta Total de Mesa</option>
                <option value="category">Por Categoría de Platos</option>
                <option value="dish">Por Plato Específico</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label fs-7 fw-semibold text-dark">Descuento (%) *</label>
              <input
                type="number"
                min="1"
                max="100"
                className="form-control rounded-3"
                required
                value={promoFormData.discountPercentage}
                onChange={e => setPromoFormData({ ...promoFormData, discountPercentage: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {promoFormData.type === 'category' && (
            <div className="mb-3">
              <label className="form-label fs-7 fw-semibold text-dark">Seleccionar Categoría Target</label>
              <select
                className="form-select rounded-3"
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
              <label className="form-label fs-7 fw-semibold text-dark">Seleccionar Plato Target</label>
              <select
                className="form-select rounded-3"
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
              <label className="form-label fs-7 fw-semibold text-dark">Fecha Inicio</label>
              <input
                type="date"
                className="form-control rounded-3"
                value={promoFormData.startDate}
                onChange={e => setPromoFormData({ ...promoFormData, startDate: e.target.value })}
              />
            </div>
            <div className="col-6">
              <label className="form-label fs-7 fw-semibold text-dark">Fecha Fin</label>
              <input
                type="date"
                className="form-control rounded-3"
                value={promoFormData.endDate}
                onChange={e => setPromoFormData({ ...promoFormData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-light fw-medium" onClick={() => setIsPromoModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-brand fw-semibold">
              Guardar Promoción
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

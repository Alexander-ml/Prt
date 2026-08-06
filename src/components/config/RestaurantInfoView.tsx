import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SectionCard } from '../common/SectionCard';

/**
 * RestaurantInfoView — Pestaña "Datos del Local" de Configuración (RF-17,
 * RF-18, RF-19). Autosuficiente: lee `useApp()` directamente y es dueña de
 * su propio formulario — igual patrón que `CategoriesView`/`DishesView` en
 * Catálogo. Los campos quedan `disabled` para cualquier rol distinto de
 * Administrador, y el botón de guardar solo se muestra para Administrador,
 * igual comportamiento que tenía `ConfigPage.tsx` antes del refactor.
 */
export const RestaurantInfoView: React.FC = () => {
  const { restaurantInfo, updateRestaurantInfo, currentRole } = useApp();
  const isAdmin = currentRole === 'Administrador';

  const [infoForm, setInfoForm] = useState({ ...restaurantInfo });

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRestaurantInfo(infoForm);
  };

  return (
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
              <i className="bi bi-check2-circle me-2"></i> Guardar Cambios de Configuración
            </button>
          </div>
        )}
      </form>
    </SectionCard>
  );
};
import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { RestaurantInfo, RestaurantOpeningDay } from '../../types';
import { SectionCard } from '../common/SectionCard';
import {
  formatOpeningHours,
  normalizeOpeningSchedule,
  WEEKDAY_META,
} from './configMeta';
import { ACCEPTED_LOGO_TYPES, MAX_LOGO_SIZE_BYTES } from '../branding/brandingMeta';

const MAX_LOGO_SIZE_LABEL = '2 MB';

/**
 * Datos del local e identidad visual. Todo se guarda dentro de
 * `restaurantInfo`, de forma que Sidebar se actualiza en el mismo render
 * después de guardar, sin estados globales paralelos.
 */
export const RestaurantInfoView: React.FC = () => {
  const { restaurantInfo, updateRestaurantInfo, currentRole } = useApp();
  const isAdmin = currentRole === 'Administrador';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [infoForm, setInfoForm] = useState<RestaurantInfo>(() => ({
    ...restaurantInfo,
    openingSchedule: normalizeOpeningSchedule(restaurantInfo.openingSchedule),
  }));

  const schedule = normalizeOpeningSchedule(infoForm.openingSchedule);

  const updateScheduleDay = (
    day: RestaurantOpeningDay['day'],
    changes: Partial<RestaurantOpeningDay>,
  ) => {
    setInfoForm(current => ({
      ...current,
      openingSchedule: normalizeOpeningSchedule(current.openingSchedule).map(item =>
        item.day === day ? { ...item, ...changes } : item,
      ),
    }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setLogoError('Selecciona una imagen PNG, JPG o WEBP.');
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setLogoError(`El logo debe pesar como máximo ${MAX_LOGO_SIZE_LABEL}.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') return;
      setInfoForm(current => ({ ...current, logo: dataUrl }));
      setLogoError(null);
    };
    reader.onerror = () => setLogoError('No se pudo leer la imagen seleccionada. Intenta nuevamente.');
    reader.readAsDataURL(file);
  };

  const handleInfoSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const updatedSchedule = normalizeOpeningSchedule(infoForm.openingSchedule);
    updateRestaurantInfo({
      ...infoForm,
      openingSchedule: updatedSchedule,
      openingHours: formatOpeningHours(updatedSchedule),
    });
  };

  return (
    <SectionCard
      icon="bi-building"
      title="Datos del local"
      subtitle="Información comercial, identidad visual y horario de atención."
      className="mb-4"
    >
      <form onSubmit={handleInfoSubmit}>
        <section className="restaurant-identity-panel mb-4" aria-labelledby="restaurant-identity-title">
          <div className="restaurant-identity-copy">
            <span className="restaurant-settings-eyebrow">Identidad visual</span>
            <h3 id="restaurant-identity-title">Logo del restaurante</h3>
          </div>

          <div className="restaurant-logo-manager">
            <div className="restaurant-logo-preview" aria-label="Vista previa del logo">
              {infoForm.logo ? (
                <img src={infoForm.logo} alt={`Logo de ${infoForm.name || 'restaurante'}`} />
              ) : (
                <>
                  <i className="bi bi-shop-window" aria-hidden="true"></i>
                </>
              )}
            </div>
            <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-sm-start">
              <button
                type="button"
                className="btn btn-brand"
                disabled={!isAdmin}
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="bi bi-image me-2" aria-hidden="true"></i>
                {infoForm.logo ? 'Cambiar logo' : 'Seleccionar logo'}
              </button>
              {infoForm.logo && (
                <button
                  type="button"
                  className="btn btn-brand-outline"
                  disabled={!isAdmin}
                  onClick={() => setInfoForm(current => ({ ...current, logo: undefined }))}
                >
                  <i className="bi bi-trash3 me-2" aria-hidden="true"></i>
                  Eliminar
                </button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept={ACCEPTED_LOGO_TYPES.join(',')}
            onChange={handleLogoChange}
            disabled={!isAdmin}
          />
          <p className="restaurant-logo-help mb-0">
            PNG, JPG o WEBP · máximo {MAX_LOGO_SIZE_LABEL} · recomendado 512 × 512 px
          </p>
          {logoError && <p className="restaurant-logo-error mb-0" role="alert">{logoError}</p>}
        </section>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="restaurant-name">Nombre del restaurante *</label>
            <input
              id="restaurant-name"
              type="text"
              className="form-control"
              disabled={!isAdmin}
              required
              value={infoForm.name}
              onChange={event => setInfoForm({ ...infoForm, name: event.target.value })}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="restaurant-tax-id">RUC / Identificación fiscal *</label>
            <input
              id="restaurant-tax-id"
              type="text"
              className="form-control"
              disabled={!isAdmin}
              required
              value={infoForm.taxId}
              onChange={event => setInfoForm({ ...infoForm, taxId: event.target.value })}
            />
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="restaurant-phone">Teléfono de contacto</label>
            <input
              id="restaurant-phone"
              type="text"
              className="form-control"
              disabled={!isAdmin}
              value={infoForm.phone}
              onChange={event => setInfoForm({ ...infoForm, phone: event.target.value })}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="restaurant-email">Correo electrónico</label>
            <input
              id="restaurant-email"
              type="email"
              className="form-control"
              disabled={!isAdmin}
              value={infoForm.email}
              onChange={event => setInfoForm({ ...infoForm, email: event.target.value })}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label" htmlFor="restaurant-address">Dirección física</label>
          <input
            id="restaurant-address"
            type="text"
            className="form-control"
            disabled={!isAdmin}
            value={infoForm.address}
            onChange={event => setInfoForm({ ...infoForm, address: event.target.value })}
          />
        </div>

        <section className="restaurant-schedule-panel mb-4" aria-labelledby="restaurant-schedule-title">
          <div className="restaurant-schedule-heading">
            <div>
              <span className="restaurant-settings-eyebrow">Operación semanal</span>
              <h3 id="restaurant-schedule-title">Horario de atención</h3>
              <p>Configura el horario de cada día o márcalo como cerrado.</p>
            </div>
            <div className="restaurant-schedule-summary" aria-label="Resumen del horario">
              <i className="bi bi-clock-history" aria-hidden="true"></i>
              {schedule.filter(item => item.isOpen).length} días abiertos
            </div>
          </div>

          <div className="restaurant-schedule-grid">
            {schedule.map(item => {
              const meta = WEEKDAY_META.find(day => day.day === item.day);
              const isOpen = item.isOpen;

              return (
                <div className={`restaurant-schedule-row ${isOpen ? '' : 'is-closed'}`} key={item.day}>
                  <div className="restaurant-schedule-day">{meta?.label ?? item.day}</div>
                  <label className="form-check form-switch restaurant-day-switch mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={isOpen}
                      disabled={!isAdmin}
                      onChange={event => updateScheduleDay(item.day, { isOpen: event.target.checked })}
                    />
                    <span>{isOpen ? 'Abierto' : 'Cerrado'}</span>
                  </label>
                  <div className="restaurant-schedule-times">
                    <label>
                      <span className="visually-hidden">Hora de apertura de {meta?.label}</span>
                      <input
                        type="time"
                        className="form-control"
                        value={item.opensAt}
                        disabled={!isAdmin || !isOpen}
                        onChange={event => updateScheduleDay(item.day, { opensAt: event.target.value })}
                      />
                    </label>
                    <span aria-hidden="true">a</span>
                    <label>
                      <span className="visually-hidden">Hora de cierre de {meta?.label}</span>
                      <input
                        type="time"
                        className="form-control"
                        value={item.closesAt}
                        disabled={!isAdmin || !isOpen}
                        onChange={event => updateScheduleDay(item.day, { closesAt: event.target.value })}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label" htmlFor="restaurant-currency">Moneda principal</label>
            <input
              id="restaurant-currency"
              type="text"
              className="form-control"
              disabled={!isAdmin}
              value={infoForm.currency}
              onChange={event => setInfoForm({ ...infoForm, currency: event.target.value })}
            />
          </div>
          <div className="col-12 col-md-8 d-flex justify-content-md-end">
            {isAdmin && (
              <button type="submit" className="btn-brand btn fw-semibold">
                <i className="bi bi-check2-circle me-2" aria-hidden="true"></i>
                Guardar cambios de configuración
              </button>
            )}
          </div>
        </div>
      </form>
    </SectionCard>
  );
};

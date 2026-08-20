import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Tax } from '../../types';
import { SectionCard } from '../common/SectionCard';
import { TaxTable } from './TaxTable';
import { TaxMobileList } from './ConfigMobileLists';
import { TaxFormModal, type TaxFormData } from './TaxFormModal';

const EMPTY_TAX_FORM: TaxFormData = { name: '', percentage: 18, active: true };

/**
 * TaxesView — Pestaña "Impuestos" de Configuración (RF-20, RF-21).
 * Dueña de su propio estado (modal de impuesto) y lee `useApp()`
 * directamente — igual que `CategoriesView`/`DishesView` en Catálogo.
 * Independiente de Datos del Local y de Promociones.
 */
export const TaxesView: React.FC = () => {
  const { taxes, addTax, updateTax, currentRole } = useApp();
  const isAdmin = currentRole === 'Administrador';

  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [taxFormData, setTaxFormData] = useState<TaxFormData>(EMPTY_TAX_FORM);

  const handleTaxFormChange = (patch: Partial<TaxFormData>) => {
    setTaxFormData(prev => ({ ...prev, ...patch }));
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
      setTaxFormData(EMPTY_TAX_FORM);
    }
    setIsTaxModalOpen(true);
  };

  return (
    <>
      <SectionCard
        icon="bi-percent"
        title="Impuestos Aplicables a las Ventas"
        noPadding
        className="config-list-card"
        actions={
          isAdmin && (
            <button
              type="button"
              className="btn-brand btn btn-sm fw-semibold"
              style={{ borderRadius: 8 }}
              onClick={() => handleOpenTaxModal()}
            >
              <i className="bi bi-plus-lg me-1"></i> Registrar Impuesto
            </button>
          )
        }
      >
        <div className="d-sm-none">
          <TaxMobileList taxes={taxes} isAdmin={isAdmin} onEdit={handleOpenTaxModal} />
        </div>
        <div className="d-none d-sm-block">
          <TaxTable taxes={taxes} isAdmin={isAdmin} onEdit={handleOpenTaxModal} />
        </div>
      </SectionCard>

      <TaxFormModal
        isOpen={isTaxModalOpen}
        onClose={() => setIsTaxModalOpen(false)}
        onSubmit={handleTaxSubmit}
        isEditing={!!editingTax}
        formData={taxFormData}
        onChange={handleTaxFormChange}
      />
    </>
  );
};

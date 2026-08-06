import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Promotion } from '../../types';
import { SectionCard } from '../common/SectionCard';
import { PromotionTable } from './PromotionTable';
import { PromotionFormModal, type PromotionFormData } from './PromotionFormModal';

const buildEmptyPromoForm = (): PromotionFormData => ({
  code: `DESC${Math.floor(10 + Math.random() * 90)}`,
  name: '',
  type: 'total',
  targetId: '',
  discountPercentage: 10,
  active: true,
  startDate: new Date().toISOString().split('T')[0],
  endDate: '2026-12-31',
});

/**
 * PromotionsView — Pestaña "Promociones" de Configuración (RF-22, RF-23).
 * Dueña de su propio estado (modal de promoción) y lee `useApp()`
 * directamente — igual que `CategoriesView`/`DishesView` en Catálogo.
 * Independiente de Datos del Local e Impuestos, salvo que necesita leer
 * `categories`/`dishes` para resolver el nombre del target y alimentar los
 * selects del formulario.
 */
export const PromotionsView: React.FC = () => {
  const { promotions, addPromotion, updatePromotion, togglePromotionActive, categories, dishes, currentRole } = useApp();
  const isAdmin = currentRole === 'Administrador';

  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [promoFormData, setPromoFormData] = useState<PromotionFormData>(buildEmptyPromoForm());

  const handlePromoFormChange = (patch: Partial<PromotionFormData>) => {
    setPromoFormData(prev => ({ ...prev, ...patch }));
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
      updatePromotion(editingPromo.id, { ...promoFormData, targetName });
    } else {
      addPromotion({ ...promoFormData, targetName });
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
        endDate: promo.endDate,
      });
    } else {
      setEditingPromo(null);
      setPromoFormData(buildEmptyPromoForm());
    }
    setIsPromoModalOpen(true);
  };

  return (
    <>
      <SectionCard
        icon="bi-ticket-perforated-fill"
        title="Promociones y Descuentos Vigentes"
        subtitle="Descuentos aplicables durante la liquidación de cuenta en Ventas."
        noPadding
        actions={
          isAdmin && (
            <button
              type="button"
              className="btn-brand btn btn-sm fw-semibold"
              style={{ borderRadius: 8 }}
              onClick={() => handleOpenPromoModal()}
            >
              <i className="bi bi-plus-lg me-1"></i> Crear Promoción
            </button>
          )
        }
      >
        <PromotionTable
          promotions={promotions}
          isAdmin={isAdmin}
          onEdit={handleOpenPromoModal}
          onToggleActive={promo => togglePromotionActive(promo.id)}
        />
      </SectionCard>

      <PromotionFormModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        onSubmit={handlePromoSubmit}
        isEditing={!!editingPromo}
        formData={promoFormData}
        onChange={handlePromoFormChange}
        categories={categories}
        dishes={dishes}
      />
    </>
  );
};
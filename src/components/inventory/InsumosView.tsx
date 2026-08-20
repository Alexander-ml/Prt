import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { Insumo } from '../../types';
import { SectionCard } from '../common/SectionCard';
import { InsumoFilterBar } from './InsumoFilterBar';
import { InsumoTable } from './InsumoTable';
import { InsumoFormModal, type InsumoFormData } from './InsumoFormModal';
import { StockMovementModal } from './StockMovementModal';

const EMPTY_INSUMO_FORM: InsumoFormData = {
  name: '',
  unit: 'Kg',
  currentStock: 10,
  minStock: 5,
  costPerUnit: 20,
  categoryId: '',
};

interface InsumosViewProps {
  /**
   * Se incrementa cada vez que InventoryPage recibe un clic en el StatCard
   * "Bajo Stock Mínimo" — permite activar el filtro de bajo stock desde
   * fuera aunque ya estuviera en 0 la vez anterior. Es el único dato que
   * InsumosView recibe por props; el resto lo lee directo de `useApp()`,
   * igual que `DishesView`.
   */
  lowStockRequestId: number;
}

/**
 * InsumosView — Pestaña "Insumos" del módulo Inventario (RF-66 a RF-72).
 * Dueña de su propio estado (búsqueda, filtros, los 2 modales) y lee
 * `useApp()` directamente, igual que `DishesView` en Catálogo y
 * `TablesConfigView` en Mesas.
 */
export const InsumosView: React.FC<InsumosViewProps> = ({ lowStockRequestId }) => {
  const { insumos, insumoCategories, addInsumo, updateInsumo, deleteInsumo, registerInsumoMovement } = useApp();

  // Search & Filter state (RF-70, RF-71)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // El StatCard "Bajo Stock Mínimo" vive en InventoryStatsRow (fuera de
  // esta vista) — cuando cambia `lowStockRequestId` (llegó un clic nuevo),
  // activamos el filtro. Se ajusta durante el render (patrón recomendado
  // por React para derivar estado a partir de props que cambian) en vez
  // de un efecto, para no disparar un render en cascada innecesario.
  const [lastHandledRequestId, setLastHandledRequestId] = useState(lowStockRequestId);
  if (lowStockRequestId !== lastHandledRequestId) {
    setLastHandledRequestId(lowStockRequestId);
    setLowStockOnly(true);
  }

  // Insumo Modal state (RF-66, RF-67)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [formData, setFormData] = useState<InsumoFormData>(EMPTY_INSUMO_FORM);

  // Movement Modal state (RF-68, RF-69)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [targetInsumo, setTargetInsumo] = useState<Insumo | null>(null);
  const [movementQty, setMovementQty] = useState<number>(5);
  const [isRestock, setIsRestock] = useState<boolean>(true);

  const filteredInsumos = useMemo(() => {
    return insumos.filter(ins => {
      const matchesSearch = ins.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'todas' || ins.categoryId === selectedCategory;
      const matchesLowStock = !lowStockOnly || ins.currentStock <= ins.minStock;
      return matchesSearch && matchesCat && matchesLowStock;
    });
  }, [insumos, searchQuery, selectedCategory, lowStockOnly]);

  // Alerta global de reposición — independiente de los filtros activos,
  // para que siga visible aunque el admin esté mirando una categoría
  // puntual. Ya funcionaba bien en el módulo anterior; se preserva tal cual.
  const lowStockInsumos = insumos.filter(i => i.currentStock <= i.minStock);

  const handleFormChange = (patch: Partial<InsumoFormData>) => {
    setFormData(prev => ({ ...prev, ...patch }));
  };

  const handleSubmitInsumo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.categoryId) return;

    if (editingInsumo) {
      updateInsumo(editingInsumo.id, {
        name: formData.name,
        unit: formData.unit,
        currentStock: Number(formData.currentStock),
        minStock: Number(formData.minStock),
        costPerUnit: Number(formData.costPerUnit),
        categoryId: formData.categoryId,
      });
    } else {
      addInsumo({
        name: formData.name,
        unit: formData.unit,
        currentStock: Number(formData.currentStock),
        minStock: Number(formData.minStock),
        costPerUnit: Number(formData.costPerUnit),
        categoryId: formData.categoryId,
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
        categoryId: ins.categoryId,
      });
    } else {
      setEditingInsumo(null);
      setFormData({ ...EMPTY_INSUMO_FORM, categoryId: insumoCategories[0]?.id || '' });
    }
    setIsModalOpen(true);
  };

  const handleOpenMovementModal = (ins: Insumo) => {
    setTargetInsumo(ins);
    setMovementQty(5);
    setIsRestock(true);
    setIsMovementModalOpen(true);
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInsumo || movementQty <= 0) return;
    registerInsumoMovement(targetInsumo.id, movementQty, isRestock);
    setIsMovementModalOpen(false);
  };

  const handleDeleteInsumo = (ins: Insumo) => {
    deleteInsumo(ins.id);
  };

  return (
    <>
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

      <InsumoFilterBar
        insumoCategories={insumoCategories}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        lowStockOnly={lowStockOnly}
        onToggleLowStockOnly={() => setLowStockOnly(prev => !prev)}
        onCreateInsumo={() => handleOpenModal()}
      />

      <SectionCard icon="bi-list-ul" title="Listado de Insumos e Ingredientes" noPadding>
        <InsumoTable
          insumos={filteredInsumos}
          onEdit={handleOpenModal}
          onRegisterMovement={handleOpenMovementModal}
          onDelete={handleDeleteInsumo}
        />
      </SectionCard>

      <InsumoFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitInsumo}
        isEditing={!!editingInsumo}
        formData={formData}
        onChange={handleFormChange}
        insumoCategories={insumoCategories}
      />

      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSubmit={handleMovementSubmit}
        targetInsumo={targetInsumo}
        quantity={movementQty}
        onQuantityChange={setMovementQty}
        isRestock={isRestock}
        onTypeChange={setIsRestock}
      />
    </>
  );
};
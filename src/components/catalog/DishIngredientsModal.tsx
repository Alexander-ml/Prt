import React from 'react';
import type { Dish, Insumo } from '../../types';
import { Modal } from '../common/Modal';

interface DishIngredientsModalProps {
  dish: Dish | null;
  insumos: Insumo[];
  isOpen: boolean;
  onClose: () => void;
}

/** Consulta de receta para operación. No permite crear, editar ni desvincular insumos. */
export const DishIngredientsModal: React.FC<DishIngredientsModalProps> = ({ dish, insumos, isOpen, onClose }) => {
  const recipe = dish?.recipe ?? [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dish ? `Insumos de ${dish.name}` : 'Insumos del plato'}
      subtitle="Consulta de la receta configurada por porción"
      size="md"
      footer={<button type="button" className="btn btn-outline-secondary rounded-3" onClick={onClose}>Cerrar</button>}
    >
      {!dish || insumos.length === 0 ? (
        <div className="catalog-empty-ingredients">
          <i className="bi bi-box-seam" aria-hidden="true"></i>
          <p>Aún no hay insumos registrados en Inventario.</p>
        </div>
      ) : recipe.length === 0 ? (
        <div className="catalog-empty-ingredients">
          <i className="bi bi-journal-x" aria-hidden="true"></i>
          <p>Este plato no tiene insumos vinculados.</p>
        </div>
      ) : (
        <ul className="catalog-ingredients-list" aria-label={`Insumos de ${dish.name}`}>
          {recipe.map(line => {
            const insumo = insumos.find(item => item.id === line.insumoId);
            return (
              <li key={line.insumoId}>
                <div>
                  <strong>{insumo?.name ?? line.insumoName}</strong>
                  {!insumo && <span className="catalog-ingredient-missing">No registrado en Inventario</span>}
                </div>
                <span>{line.quantityPerServing} {insumo?.unit ?? 'unidad sin registrar'}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
};

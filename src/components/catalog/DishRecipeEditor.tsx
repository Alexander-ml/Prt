import React from 'react';
import type { DishRecipeItem, Insumo } from '../../types';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';

interface DishRecipeEditorProps {
  insumos: Insumo[];
  recipe: DishRecipeItem[];
  onChange: (recipe: DishRecipeItem[]) => void;
}

/**
 * DishRecipeEditor — Sub-sección OPCIONAL del formulario de plato:
 * "Insumos Utilizados" (la receta / bill of materials). Vive dentro de
 * `DishFormModal` porque el dato le pertenece al plato y ya es ahí donde
 * se edita todo lo demás (precio, estación, alérgenos) — se extrae a un
 * componente propio para no inflar más un modal que ya tenía 182 líneas.
 *
 * Componente controlado puro: no llama `useApp()`, recibe `insumos` como
 * prop (los provee `DishesView`, que sí conoce el AppContext) y reporta
 * cada cambio hacia arriba vía `onChange`. Es el vínculo Catálogo↔Inventario
 * que antes no existía (ver diagnóstico de Inventario, sección 4.1).
 */
export const DishRecipeEditor: React.FC<DishRecipeEditorProps> = ({ insumos, recipe, onChange }) => {
  const usedIds = new Set(recipe.map(line => line.insumoId));
  const hasAvailableInsumos = insumos.some(i => !usedIds.has(i.id));

  const updateLine = (index: number, patch: Partial<DishRecipeItem>) => {
    onChange(recipe.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const handleInsumoChange = (index: number, insumoId: string) => {
    const insumo = insumos.find(i => i.id === insumoId);
    updateLine(index, { insumoId, insumoName: insumo?.name ?? '' });
  };

  const removeLine = (index: number) => {
    onChange(recipe.filter((_, i) => i !== index));
  };

  const addLine = () => {
    const nextInsumo = insumos.find(i => !usedIds.has(i.id));
    if (!nextInsumo) return;
    onChange([...recipe, { insumoId: nextInsumo.id, insumoName: nextInsumo.name, quantityPerServing: 0.1 }]);
  };

  if (insumos.length === 0) {
    return (
      <p className="form-text mb-0">
        Aún no hay insumos registrados en Inventario — registra insumos primero para poder vincular una receta.
      </p>
    );
  }

  return (
    <div>
      {recipe.length === 0 ? (
        <p className="form-text mt-0 mb-2">
          Sin insumos vinculados. El plato seguirá funcionando en Cocina y Pedidos como hasta ahora, solo que sin
          descontar stock automáticamente.
        </p>
      ) : (
        <div className="d-flex flex-column gap-2 mb-2">
          {recipe.map((line, index) => {
            const selectedInsumo = insumos.find(i => i.id === line.insumoId);
            const rowOptions = insumos.filter(i => i.id === line.insumoId || !usedIds.has(i.id));
            return (
              <div key={`${line.insumoId}-${index}`} className="row g-2 align-items-center">
                <div className="col-6">
                  <CustomDropdownSelect
                    value={line.insumoId}
                    onChange={value => handleInsumoChange(index, value)}
                    size="sm"
                    placeholder="Seleccione insumo..."
                    options={rowOptions.map(i => ({
                      value: i.id,
                      label: i.name,
                      icon: 'bi-boxes',
                      colorVariant: 'primary' as const,
                    }))}
                  />
                </div>
                <div className="col-4">
                  <div className="input-group input-group-sm">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="form-control"
                      aria-label={`Cantidad por porción de ${selectedInsumo?.name ?? 'insumo'}`}
                      value={line.quantityPerServing}
                      onChange={e => updateLine(index, { quantityPerServing: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="input-group-text">{selectedInsumo?.unit ?? 'un.'}</span>
                  </div>
                </div>
                <div className="col-2 text-end">
                  <button
                    type="button"
                    className="btn-icon btn-icon-danger"
                    aria-label={`Quitar ${selectedInsumo?.name ?? 'insumo'} de la receta`}
                    onClick={() => removeLine(index)}
                  >
                    <i className="bi bi-trash-fill" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className="btn btn-outline-secondary btn-sm rounded-3"
        onClick={addLine}
        disabled={!hasAvailableInsumos}
      >
        <i className="bi bi-plus-lg me-1" aria-hidden="true"></i> Agregar Insumo
      </button>
    </div>
  );
};
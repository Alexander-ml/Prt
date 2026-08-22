import React from 'react';
import type { Tax } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';

interface TaxTableProps {
  taxes: Tax[];
  isAdmin: boolean;
  onEdit: (tax: Tax) => void;
}

/**
 * TaxTable — Tabla de impuestos aplicables a las ventas, presentacional
 * pura. No recibe nada de Promociones ni de Datos del Local (Interface
 * Segregation) — solo lo necesario para listar impuestos y disparar su
 * edición. Sin acción de "Eliminar" a propósito: no se debe poder borrar
 * un impuesto que ya se usó en ventas históricas.
 */
export const TaxTable: React.FC<TaxTableProps> = ({ taxes, isAdmin, onEdit }) => {
  return (
    <div className="table-responsive-x">
      <div className="custom-table-container">
        <table className="custom-table tax-table">
          <thead>
            <tr>
              <th>Nombre del Impuesto</th>
              <th>Porcentaje (%)</th>
              <th>Estado</th>
              {isAdmin && <th className="text-end">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {taxes.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 4 : 3}>
                  <EmptyState icon="bi-percent" title="Aún no hay impuestos configurados" />
                </td>
              </tr>
            ) : (
              taxes.map(tax => (
                <tr key={tax.id}>
                  <td><div className="fw-bold tax-table-name">{tax.name}</div></td>
                  <td><span className="fw-bold fs-6 tax-table-percentage">{tax.percentage}%</span></td>
                  <td>
                    <Badge
                      status={tax.active ? 'Activo en Ventas' : 'Desactivado'}
                      variant={tax.active ? 'success' : 'secondary'}
                    />
                  </td>
                  {isAdmin && (
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn-icon btn-icon-primary"
                        title="Editar o Desactivar Impuesto"
                        onClick={() => onEdit(tax)}
                      >
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

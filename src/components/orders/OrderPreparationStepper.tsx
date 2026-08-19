import React from 'react';
import type { OrderItemStatus } from '../../types';

const PREPARATION_STEPS: Array<{ status: Exclude<OrderItemStatus, 'cancelado'>; label: string }> = [
  { status: 'pendiente', label: 'Pendiente' },
  { status: 'preparando', label: 'Preparando' },
  { status: 'listo', label: 'Listo' },
  { status: 'entregado', label: 'Entregado' },
];

interface OrderPreparationStepperProps {
  status: OrderItemStatus;
}

/**
 * Progreso de cocina en formato vertical para la ficha móvil de un ítem.
 * Es deliberadamente informativo: los cambios de estado siguen realizándose
 * desde Cocina, sin duplicar ni alterar esa lógica en Pedidos.
 */
export const OrderPreparationStepper: React.FC<OrderPreparationStepperProps> = ({ status }) => {
  if (status === 'cancelado') {
    return (
      <p className="order-preparation-cancelled mb-0">
        <i className="bi bi-slash-circle-fill" aria-hidden="true"></i>
        Ítem cancelado
      </p>
    );
  }

  const currentIndex = PREPARATION_STEPS.findIndex(step => step.status === status);

  return (
    <ol className="order-preparation-stepper" aria-label={`Progreso de preparación: ${status}`}>
      {PREPARATION_STEPS.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isComplete = index < currentIndex;
        return (
          <li
            key={step.status}
            className={isCurrent ? 'is-current' : isComplete ? 'is-complete' : ''}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className="order-preparation-stepper-marker" aria-hidden="true">
              <i className={`bi ${isComplete ? 'bi-check' : isCurrent ? 'bi-dot' : 'bi-circle'}`}></i>
            </span>
            <span>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
};

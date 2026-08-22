import React from 'react';

export type BillingStepStatus = 'done' | 'active' | 'pending';

export interface BillingStepDef {
  label: string;
  icon: string;
  status: BillingStepStatus;
}

interface BillingStepsProps {
  steps: BillingStepDef[];
}

/**
 * BillingSteps — Narrativa visual del cobro (punto #3 y #12 del análisis UX).
 *
 * El flujo de cobro real es: Mesa → Cliente/Comprobante → Pago → Cobrar. Antes
 * esto solo se notaba por el número dentro del título de cada SectionCard
 * ("1. Resumen…", "2. Comprobante…"), sin ninguna señal de progreso ni de en
 * qué paso está el cajero. Este componente no cambia ninguna lógica: solo
 * traduce el estado que ya existe (mesa elegida, cliente ok, pago completo,
 * listo para cobrar) en una guía visual de 4 pasos.
 */
export const BillingSteps: React.FC<BillingStepsProps> = ({ steps }) => {
  return (
    <div className="d-flex align-items-start billing-steps" role="list" aria-label="Progreso del cobro">
      {steps.map((step, idx) => {
        const nextStep = steps[idx + 1];
        const connectorDimmed = step.status === 'pending' && nextStep?.status === 'pending';
        return (
          <React.Fragment key={step.label}>
            <div role="listitem" className="d-flex flex-column align-items-center text-center flex-shrink-0 billing-step">
              <div
                aria-hidden="true"
                className={`d-flex align-items-center justify-content-center fw-bold billing-step-circle is-${step.status}`}
              >
                {step.status === 'done' ? <i className="bi bi-check-lg"></i> : <i className={`bi ${step.icon}`}></i>}
              </div>
              <small className={`mt-1 fw-semibold text-truncate billing-step-label is-${step.status}`}>
                {step.label}
              </small>
            </div>
            {idx < steps.length - 1 && (
              <div
                aria-hidden="true"
                className={`flex-shrink-0 billing-step-connector${step.status === 'pending' ? ' is-pending' : ''}${connectorDimmed ? ' is-dimmed' : ''}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

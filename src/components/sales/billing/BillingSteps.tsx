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

const STATUS_STYLES: Record<BillingStepStatus, React.CSSProperties> = {
  done: {
    background: 'var(--color-emerald)',
    color: '#fff',
    borderColor: 'var(--color-emerald)',
  },
  active: {
    background: 'var(--color-brand)',
    color: '#fff',
    borderColor: 'var(--color-brand)',
    boxShadow: '0 0 0 4px var(--color-brand-light)',
  },
  pending: {
    background: '#fff',
    color: 'var(--text-muted)',
    borderColor: 'var(--border-color)',
  },
};

const LABEL_COLOR: Record<BillingStepStatus, string> = {
  done: 'var(--color-emerald-text)',
  active: 'var(--color-brand)',
  pending: 'var(--text-muted)',
};

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
    <div
      className="d-flex align-items-start"
      role="list"
      aria-label="Progreso del cobro"
      style={{ overflowX: 'auto', paddingBottom: 2 }}
    >
      {steps.map((step, idx) => (
        <React.Fragment key={step.label}>
          <div
            role="listitem"
            className="d-flex flex-column align-items-center text-center flex-shrink-0"
            style={{ width: 84 }}
          >
            <div
              aria-hidden="true"
              className="d-flex align-items-center justify-content-center fw-bold"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '2px solid',
                fontSize: '0.9rem',
                transition: 'all 0.15s ease',
                ...STATUS_STYLES[step.status],
              }}
            >
              {step.status === 'done' ? <i className="bi bi-check-lg"></i> : <i className={`bi ${step.icon}`}></i>}
            </div>
            <small
              className="mt-1 fw-semibold text-truncate"
              style={{ fontSize: '0.7rem', color: LABEL_COLOR[step.status], maxWidth: 84 }}
            >
              {step.label}
            </small>
          </div>
          {idx < steps.length - 1 && (
            <div
              aria-hidden="true"
              className="flex-shrink-0"
              style={{
                height: 2,
                minWidth: 20,
                flex: '1 1 20px',
                marginTop: 16,
                background: step.status === 'pending' ? 'var(--border-color)' : 'var(--color-emerald)',
                opacity: steps[idx + 1]?.status === 'pending' && step.status === 'pending' ? 0.6 : 1,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
import React, { useState } from 'react';
import type { PaymentMethodType, PaymentSplitEntry } from '../../../types';
import { formatMoney } from '../../../utils/money';
import { getPaymentMethodMeta } from '../../../utils/payments';

type CategoryKey = 'efectivo' | 'tarjeta' | 'yape' | 'plin' | 'transferencia' | 'otro';

interface CategoryDef {
  key: CategoryKey;
  label: string;
  icon: string;
  /** Categoría directa: un solo método, se agrega al primer toque. */
  method?: PaymentMethodType;
  /** Categoría con sub-tipos: solo revela las opciones al tocarla. */
  group?: PaymentMethodType[];
}

const CATEGORIES: CategoryDef[] = [
  { key: 'efectivo', label: 'Efectivo', icon: 'bi-cash-coin', method: 'efectivo' },
  { key: 'tarjeta', label: 'Tarjeta', icon: 'bi-credit-card-fill', group: ['visa', 'mastercard', 'amex'] },
  { key: 'yape', label: 'Yape', icon: 'bi-phone-fill', method: 'yape' },
  { key: 'plin', label: 'Plin', icon: 'bi-phone-vibrate-fill', method: 'plin' },
  { key: 'transferencia', label: 'Transferencia', icon: 'bi-bank2', method: 'transferencia' },
  { key: 'otro', label: 'Otro', icon: 'bi-three-dots', group: ['vale_consumo', 'credito_interno'] },
];

interface PaymentMethodPickerProps {
  disabled: boolean;
  paymentBreakdown: PaymentSplitEntry[];
  pendingBalance: number;
  onAddPaymentLine: (method: PaymentMethodType) => void;
  onUpdatePaymentLineAmount: (id: string, amountInput: string) => void;
  onRemovePaymentLine: (id: string) => void;
  cashReceivedInput: string;
  setCashReceivedInput: (val: string) => void;
  changeGiven: number;
}

/**
 * PaymentMethodPicker — Forma de Pago con revelación progresiva
 * (punto #1 y #11 del análisis UX).
 *
 * Antes se mostraban las 9 formas de pago concretas (Visa, Mastercard, Amex,
 * Yape, Plin…) todas al mismo tiempo, ocupando mucho espacio con información
 * que el cajero no necesita ver hasta que elige "pagar con tarjeta". Ahora
 * solo hay 6 botones de primer nivel; "Tarjeta" y "Otro" abren un sub-panel
 * de opciones recién cuando se tocan, y se agrega la línea de pago al elegir
 * el tipo concreto. El resto de la lógica (líneas de pago, vuelto, saldo
 * pendiente) es exactamente la misma de antes.
 */
export const PaymentMethodPicker: React.FC<PaymentMethodPickerProps> = ({
  disabled,
  paymentBreakdown,
  pendingBalance,
  onAddPaymentLine,
  onUpdatePaymentLineAmount,
  onRemovePaymentLine,
  cashReceivedInput,
  setCashReceivedInput,
  changeGiven,
}) => {
  const [expanded, setExpanded] = useState<CategoryKey | null>(null);

  const isMethodAdded = (method: PaymentMethodType) => paymentBreakdown.some(p => p.method === method);

  const handleCategoryClick = (cat: CategoryDef) => {
    if (disabled) return;
    if (cat.method) {
      if (isMethodAdded(cat.method)) return;
      onAddPaymentLine(cat.method);
      setExpanded(null);
      return;
    }
    setExpanded(prev => (prev === cat.key ? null : cat.key));
  };

  const handleSubOptionClick = (method: PaymentMethodType) => {
    if (disabled || isMethodAdded(method)) return;
    onAddPaymentLine(method);
    setExpanded(null);
  };

  const hasCashLine = paymentBreakdown.some(p => p.method === 'efectivo');
  const cashLine = paymentBreakdown.find(p => p.method === 'efectivo');
  const expandedCategory = CATEGORIES.find(c => c.key === expanded);

  return (
    <fieldset className="border-0 p-0 m-0" disabled={disabled}>
      <legend className="form-label fw-bold h6 mb-2">Forma de Pago</legend>

      {/* Nivel 1: categorías amplias */}
      <div className="row row-cols-3 g-2 mb-2">
        {CATEGORIES.map(cat => {
          const isDirectAdded = !!cat.method && isMethodAdded(cat.method);
          const isGroupAdded = !!cat.group && cat.group.some(isMethodAdded);
          const isActive = isDirectAdded || isGroupAdded || expanded === cat.key;
          const isDisabledOption = disabled || isDirectAdded;
          return (
            <div className="col" key={cat.key}>
              <button
                type="button"
                disabled={isDisabledOption}
                aria-pressed={isActive}
                aria-expanded={cat.group ? expanded === cat.key : undefined}
                className={`btn w-100 fw-semibold rounded-3 payment-category-btn ${isActive ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                onClick={() => handleCategoryClick(cat)}
                title={cat.label}
              >
                <i className={`bi ${cat.icon} d-block mb-1`}></i>
                <span className="text-truncate d-block">{cat.label}</span>
                {isGroupAdded && (
                  <i className={`bi bi-check-circle-fill payment-category-check${isActive ? ' is-active' : ''}`}></i>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Nivel 2: sub-tipo, solo aparece si se tocó "Tarjeta" u "Otro" */}
      {expandedCategory?.group && (
        <div className="p-2 rounded-3 mb-3 d-flex flex-wrap gap-2 payment-subgroup-box">
          <small className="w-100 fw-semibold payment-subgroup-hint">
            <i className="bi bi-arrow-return-right me-1"></i>
            Seleccione tipo de {expandedCategory.label.toLowerCase()}
          </small>
          {expandedCategory.group.map(method => {
            const meta = getPaymentMethodMeta(method);
            const added = isMethodAdded(method);
            return (
              <button
                key={method}
                type="button"
                disabled={added}
                className={`btn btn-sm fw-semibold rounded-pill payment-subgroup-btn ${added ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                onClick={() => handleSubOptionClick(method)}
              >
                <i className={`bi ${meta.icon} me-1`}></i>
                {meta.label}
                {added && <i className="bi bi-check-lg ms-1"></i>}
              </button>
            );
          })}
        </div>
      )}

      {/* Líneas de pago ya agregadas */}
      {paymentBreakdown.length > 0 && (
        <div className="d-flex flex-column gap-2 mb-2">
          {paymentBreakdown.map(line => (
            <div
              key={line.id}
              className="p-2 rounded-3 d-flex align-items-center gap-2 payment-line"
            >
              <i className={`bi ${getPaymentMethodMeta(line.method).icon} flex-shrink-0 payment-line-icon`}></i>
              <span className="text-truncate flex-grow-1 fw-semibold payment-line-label">
                {getPaymentMethodMeta(line.method).label}
              </span>
              <div className="input-group input-group-sm flex-shrink-0 payment-line-input-group">
                <span className="input-group-text py-1 px-2">S/</span>
                <input
                  type="number"
                  min={0}
                  step="0.10"
                  className="form-control text-end"
                  value={line.amount}
                  onChange={e => onUpdatePaymentLineAmount(line.id, e.target.value)}
                  aria-label={`Monto pagado con ${getPaymentMethodMeta(line.method).label}`}
                />
              </div>
              <button
                type="button"
                className="btn-icon btn-icon-danger flex-shrink-0 payment-line-remove-btn"
                aria-label={`Quitar línea de pago ${getPaymentMethodMeta(line.method).label}`}
                onClick={() => onRemovePaymentLine(line.id)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {hasCashLine && cashLine && (
        <div className="p-2 rounded-3 mb-2 payment-cash-box">
          <label htmlFor="cashReceivedInput" className="form-label fw-semibold mb-1">
            Efectivo Recibido (línea de {formatMoney(cashLine.amount)})
          </label>
          <div className="input-group input-group-sm">
            <span className="input-group-text py-1 px-2">S/</span>
            <input
              id="cashReceivedInput"
              type="number"
              min={0}
              step="0.10"
              className="form-control"
              placeholder={cashLine.amount.toFixed(2)}
              value={cashReceivedInput}
              onChange={e => setCashReceivedInput(e.target.value)}
            />
          </div>
          <div className="d-flex justify-content-between mt-1 payment-cash-change-row">
            <span className="fw-semibold">Vuelto:</span>
            <span className="fw-bold">{formatMoney(changeGiven)}</span>
          </div>
        </div>
      )}

      {paymentBreakdown.length > 0 && Math.abs(pendingBalance) > 0.009 && (
        <div className="p-2 rounded-3 d-flex align-items-center gap-2 payment-pending-warning">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <small className="fw-semibold">
            {pendingBalance > 0
              ? `Falta cubrir ${formatMoney(pendingBalance)} del total.`
              : `El desglose excede el total en ${formatMoney(Math.abs(pendingBalance))}.`}
          </small>
        </div>
      )}
    </fieldset>
  );
};

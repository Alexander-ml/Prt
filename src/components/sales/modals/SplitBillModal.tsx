import React, { useState, useEffect } from 'react';
import type { Order, GuestBillSplit, SplitMode } from '../../../types';
import { Modal } from '../../common/Modal';
import { formatMoney, round2 } from '../../../utils/money';
import { distributeRemainder } from './salesModalsShared';

/* ─────────────────────────────────────────────────────────────
   SplitBillModal — División de cuenta (RF-58 ampliado, punto #9
   del análisis UX).
   Dos modos: equitativo (N partes iguales) y por_platos (cada
   comensal se lleva ítems concretos de la comanda). El resultado
   siempre reparte el TOTAL exacto (impuestos, propina, descuento y
   redondeo incluidos, prorrateados por participación) para que la
   suma de las partes nunca quede desalineada del total cobrado.
   ───────────────────────────────────────────────────────────── */
interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | undefined;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  tipAmount: number;
  roundingAdjustment: number;
  totalAmount: number;
  onConfirm: (mode: SplitMode, splits: GuestBillSplit[]) => void;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  isOpen,
  onClose,
  order,
  subtotal,
  discountAmount,
  taxAmount,
  tipAmount,
  roundingAdjustment,
  totalAmount,
  onConfirm,
}) => {
  const [mode, setMode] = useState<SplitMode>('equitativo');
  const [guestNames, setGuestNames] = useState<string[]>(['Comensal 1', 'Comensal 2']);
  const [assignments, setAssignments] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      setMode('equitativo');
      setGuestNames(['Comensal 1', 'Comensal 2']);
      setAssignments({});
    }
  }, [isOpen]);

  const items = order?.items ?? [];
  const guestCount = guestNames.length;

  const handleUpdateGuestCount = (count: number) => {
    const clamped = Math.max(2, count);
    setGuestNames(prev => {
      if (clamped > prev.length) {
        return [...prev, ...Array.from({ length: clamped - prev.length }, (_, i) => `Comensal ${prev.length + i + 1}`)];
      }
      return prev.slice(0, clamped);
    });
    setAssignments(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(itemId => {
        if (next[itemId] >= clamped) delete next[itemId];
      });
      return next;
    });
  };

  const handleRenameGuest = (idx: number, name: string) => {
    setGuestNames(prev => prev.map((n, i) => (i === idx ? name : n)));
  };

  const handleAssignItem = (itemId: string, guestIdx: number | null) => {
    setAssignments(prev => {
      const next = { ...prev };
      if (guestIdx === null) delete next[itemId];
      else next[itemId] = guestIdx;
      return next;
    });
  };

  // Modo equitativo: se reparte el total en N partes, ajustando la última
  // parte para que la suma cuadre exacto al centavo.
  const equalAmounts = distributeRemainder(
    Array.from({ length: guestCount }, () => round2(totalAmount / guestCount)),
    totalAmount
  );
  const equalSplits: GuestBillSplit[] = guestNames.map((name, i) => ({
    id: `split-${i + 1}`,
    guestName: name,
    items: [],
    totalAmount: equalAmounts[i] ?? 0,
    paid: false,
  }));

  // Modo por platos: cada comensal se lleva el prorrateo de descuento, IGV,
  // propina y redondeo proporcional a lo que consumió (no todos comieron lo
  // mismo, así que no es justo dividir esos conceptos en partes iguales).
  const unassignedItems = items.filter(it => assignments[it.id] === undefined);
  const unassignedAmount = round2(unassignedItems.reduce((s, it) => s + it.price * it.quantity, 0));
  const extraPool = round2(taxAmount + tipAmount - discountAmount + roundingAdjustment);

  const porPlatosRaw = guestNames.map((_, gi) => {
    const guestItems = items.filter(it => assignments[it.id] === gi);
    const guestSubtotal = round2(guestItems.reduce((s, it) => s + it.price * it.quantity, 0));
    const ratio = subtotal > 0 ? guestSubtotal / subtotal : 0;
    return round2(guestSubtotal + ratio * extraPool);
  });
  const porPlatosAmounts = distributeRemainder(porPlatosRaw, totalAmount);
  const porPlatosSplits: GuestBillSplit[] = guestNames.map((name, gi) => {
    const guestItems = items.filter(it => assignments[it.id] === gi);
    return {
      id: `split-${gi + 1}`,
      guestName: name,
      items: guestItems.map(it => ({
        orderItemId: it.id,
        dishName: it.dishName,
        quantity: it.quantity,
        amount: round2(it.price * it.quantity),
      })),
      totalAmount: porPlatosAmounts[gi] ?? 0,
      paid: false,
    };
  });

  const canConfirm = mode === 'equitativo' ? guestCount >= 2 : items.length > 0 && unassignedAmount === 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(mode, mode === 'equitativo' ? equalSplits : porPlatosSplits);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="División de Cuenta" size="lg">
      {/* Selector de modo */}
      <div className="d-flex gap-2 mb-4">
        <button
          type="button"
          className={`btn flex-fill fw-semibold ${mode === 'equitativo' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
          style={{ borderRadius: 8, minHeight: 44 }}
          onClick={() => setMode('equitativo')}
        >
          <i className="bi bi-people-fill me-1"></i> Partes Iguales
        </button>
        <button
          type="button"
          className={`btn flex-fill fw-semibold ${mode === 'por_platos' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
          style={{ borderRadius: 8, minHeight: 44 }}
          disabled={items.length === 0}
          onClick={() => setMode('por_platos')}
        >
          <i className="bi bi-list-check me-1"></i> Por Platos
        </button>
      </div>

      {/* Número de comensales (común a ambos modos) */}
      <div className="mb-3">
        <label className="form-label fw-bold">Número de Comensales</label>
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-outline-secondary"
            style={{ borderRadius: 8, width: 40, height: 40, padding: 0 }}
            disabled={guestCount <= 2}
            aria-label="Reducir número de comensales"
            onClick={() => handleUpdateGuestCount(guestCount - 1)}
          >
            <i className="bi bi-dash"></i>
          </button>
          <span className="fw-bold fs-4 px-2">{guestCount}</span>
          <button
            type="button"
            className="btn btn-outline-secondary"
            style={{ borderRadius: 8, width: 40, height: 40, padding: 0 }}
            aria-label="Aumentar número de comensales"
            onClick={() => handleUpdateGuestCount(guestCount + 1)}
          >
            <i className="bi bi-plus"></i>
          </button>
          <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Mínimo 2 comensales</small>
        </div>
      </div>

      {mode === 'equitativo' ? (
        <div className="d-flex flex-column gap-2 mb-3">
          {guestNames.map((name, idx) => (
            <div
              key={idx}
              className="p-2 rounded-3 d-flex align-items-center justify-content-between gap-2"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border-color)' }}
            >
              <input
                type="text"
                className="form-control form-control-sm fw-semibold"
                style={{ borderRadius: 6, maxWidth: 220, background: 'white' }}
                value={name}
                aria-label={`Nombre del comensal ${idx + 1}`}
                onChange={e => handleRenameGuest(idx, e.target.value)}
              />
              <span className="fw-bold flex-shrink-0" style={{ color: 'var(--color-brand)', fontSize: '1.05rem' }}>
                {formatMoney(equalAmounts[idx] ?? 0)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3">
          <div className="d-flex flex-column gap-2 mb-2" style={{ maxHeight: 260, overflowY: 'auto' }}>
            {guestNames.map((name, idx) => (
              <input
                key={idx}
                type="text"
                className="form-control form-control-sm fw-semibold mb-1"
                style={{ borderRadius: 6, maxWidth: 220 }}
                value={name}
                aria-label={`Nombre del comensal ${idx + 1}`}
                onChange={e => handleRenameGuest(idx, e.target.value)}
              />
            ))}
            <div className="table-responsive-x mt-2">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Plato</th>
                    <th className="text-end">Monto</th>
                    <th>Asignar a</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id}>
                      <td>{it.quantity}x {it.dishName}</td>
                      <td className="text-end fw-semibold">{formatMoney(it.price * it.quantity)}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          style={{ minWidth: 150 }}
                          value={assignments[it.id] ?? ''}
                          onChange={e => handleAssignItem(it.id, e.target.value === '' ? null : Number(e.target.value))}
                        >
                          <option value="">Sin asignar</option>
                          {guestNames.map((name, gi) => (
                            <option key={gi} value={gi}>{name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {unassignedAmount > 0 && (
            <div className="p-2 rounded-3 d-flex align-items-center gap-2" style={{ background: 'var(--color-amber-bg)', border: '1px solid #fcd34d' }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ color: 'var(--color-amber-text)' }}></i>
              <small className="fw-semibold" style={{ color: 'var(--color-amber-text)' }}>
                Falta asignar {formatMoney(unassignedAmount)} en platos antes de poder dividir la cuenta.
              </small>
            </div>
          )}
        </div>
      )}

      <div className="p-2 rounded-3 d-flex justify-content-between mb-4" style={{ background: 'var(--color-brand-light)', fontSize: '0.8rem' }}>
        <span className="fw-semibold" style={{ color: 'var(--color-brand)' }}>Suma de partes:</span>
        <span className="fw-bold" style={{ color: 'var(--color-brand)' }}>
          {formatMoney((mode === 'equitativo' ? equalSplits : porPlatosSplits).reduce((sum, s) => sum + s.totalAmount, 0))}
          {' '}/ {formatMoney(totalAmount)}
        </span>
      </div>

      <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-brand btn fw-semibold"
          style={{ borderRadius: 8 }}
          disabled={!canConfirm}
          onClick={handleConfirm}
        >
          <i className="bi bi-check-lg me-1"></i>Confirmar División
        </button>
      </div>
    </Modal>
  );
};

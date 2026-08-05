import React, { useState, useEffect } from 'react';
import type {
  Sale,
  Order,
  Cliente,
  CashSession,
  GuestBillSplit,
  SplitMode,
  TipoComprobante,
  TipoDocumentoCliente,
  PaymentMethodType,
  PaymentSplitEntry,
  CashPaymentDetail,
  UpdateSalePaymentParams,
} from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { formatMoney, round2 } from '../../utils/money';
import { PAYMENT_METHODS, getPaymentMethodMeta } from '../../utils/payments';

const COMPROBANTE_LABELS: Record<TipoComprobante, string> = {
  ticket: 'Ticket',
  boleta: 'Boleta',
  factura: 'Factura',
};

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

/** Ajusta el último monto de la lista para que la suma cuadre exacto con target (evita céntimos perdidos por redondeo). */
const distributeRemainder = (amounts: number[], target: number): number[] => {
  if (amounts.length === 0) return amounts;
  const sum = round2(amounts.reduce((a, b) => a + b, 0));
  const diff = round2(target - sum);
  const adjusted = [...amounts];
  adjusted[adjusted.length - 1] = round2(adjusted[adjusted.length - 1] + diff);
  return adjusted;
};

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

/* ─────────────────────────────────────────────────────────────
   ClienteModal — Alta rápida de cliente para Boleta/Factura
   (punto #13 del análisis UX).
   ───────────────────────────────────────────────────────────── */
interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTipoDocumento?: TipoDocumentoCliente;
  onSave: (data: Omit<Cliente, 'id'>) => void;
}

export const ClienteModal: React.FC<ClienteModalProps> = ({ isOpen, onClose, defaultTipoDocumento = 'DNI', onSave }) => {
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoCliente>(defaultTipoDocumento);
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [nombreORazonSocial, setNombreORazonSocial] = useState('');
  const [direccion, setDireccion] = useState('');
  const [correo, setCorreo] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTipoDocumento(defaultTipoDocumento);
      setNumeroDocumento('');
      setNombreORazonSocial('');
      setDireccion('');
      setCorreo('');
    }
  }, [isOpen, defaultTipoDocumento]);

  const expectedLength = tipoDocumento === 'RUC' ? 11 : 8;
  const isValid =
    numeroDocumento.trim().length === expectedLength &&
    /^\d+$/.test(numeroDocumento.trim()) &&
    nombreORazonSocial.trim().length > 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      tipoDocumento,
      numeroDocumento: numeroDocumento.trim(),
      nombreORazonSocial: nombreORazonSocial.trim(),
      direccion: direccion.trim() || undefined,
      correo: correo.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Cliente" size="sm">
      <div className="mb-3">
        <label className="form-label fw-bold">Tipo de Documento</label>
        <div className="d-flex gap-2">
          {(['DNI', 'RUC'] as TipoDocumentoCliente[]).map(t => (
            <button
              key={t}
              type="button"
              className={`btn flex-fill fw-semibold ${tipoDocumento === t ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
              style={{ borderRadius: 8, minHeight: 40 }}
              onClick={() => { setTipoDocumento(t); setNumeroDocumento(''); }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="clienteNumDoc">{tipoDocumento === 'RUC' ? 'RUC (11 dígitos)' : 'DNI (8 dígitos)'}</label>
        <input
          id="clienteNumDoc"
          type="text"
          inputMode="numeric"
          className="form-control"
          style={{ borderRadius: 8 }}
          maxLength={expectedLength}
          value={numeroDocumento}
          onChange={e => setNumeroDocumento(e.target.value.replace(/\D/g, ''))}
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="clienteNombre">{tipoDocumento === 'RUC' ? 'Razón Social' : 'Nombre Completo'}</label>
        <input
          id="clienteNombre"
          type="text"
          className="form-control"
          style={{ borderRadius: 8 }}
          value={nombreORazonSocial}
          onChange={e => setNombreORazonSocial(e.target.value)}
        />
      </div>
      {tipoDocumento === 'RUC' && (
        <div className="mb-3">
          <label className="form-label" htmlFor="clienteDireccion">Dirección Fiscal</label>
          <input
            id="clienteDireccion"
            type="text"
            className="form-control"
            style={{ borderRadius: 8 }}
            value={direccion}
            onChange={e => setDireccion(e.target.value)}
          />
        </div>
      )}
      <div className="mb-3">
        <label className="form-label" htmlFor="clienteCorreo">Correo (opcional)</label>
        <input
          id="clienteCorreo"
          type="email"
          className="form-control"
          style={{ borderRadius: 8 }}
          value={correo}
          onChange={e => setCorreo(e.target.value)}
        />
      </div>
      <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }} disabled={!isValid} onClick={handleSave}>
          <i className="bi bi-check-lg me-1"></i>Guardar Cliente
        </button>
      </div>
    </Modal>
  );
};

/* ─────────────────────────────────────────────────────────────
   OpenCashSessionModal / CloseCashSessionModal / CashMovementModal
   — Ciclo de caja (RF-56 v2, punto #16 del análisis UX).
   ───────────────────────────────────────────────────────────── */
interface OpenCashSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  openedByLabel: string;
  onConfirm: (initialAmount: number) => void;
}

export const OpenCashSessionModal: React.FC<OpenCashSessionModalProps> = ({ isOpen, onClose, openedByLabel, onConfirm }) => {
  const [amountInput, setAmountInput] = useState('');

  useEffect(() => {
    if (isOpen) setAmountInput('');
  }, [isOpen]);

  const amount = parseFloat(amountInput);
  const isValid = !isNaN(amount) && amount >= 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Abrir Caja" size="sm">
      <div className="mb-3">
        <label className="form-label fw-bold" htmlFor="fondoInicial">Fondo Inicial de Caja</label>
        <div className="input-group">
          <span className="input-group-text">S/</span>
          <input
            id="fondoInicial"
            type="number"
            min={0}
            step="0.10"
            className="form-control"
            placeholder="0.00"
            autoFocus
            value={amountInput}
            onChange={e => setAmountInput(e.target.value)}
          />
        </div>
        <small className="d-block mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          <i className="bi bi-person-badge me-1"></i>Turno a nombre de: <strong>{openedByLabel}</strong>
        </small>
      </div>
      <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-brand btn fw-semibold"
          style={{ borderRadius: 8 }}
          disabled={!isValid}
          onClick={() => { if (isValid) { onConfirm(round2(amount)); onClose(); } }}
        >
          <i className="bi bi-unlock-fill me-1"></i>Abrir Caja
        </button>
      </div>
    </Modal>
  );
};

interface CloseCashSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashSession: CashSession | null;
  closedByLabel: string;
  onConfirm: (countedCash: number) => void;
}

export const CloseCashSessionModal: React.FC<CloseCashSessionModalProps> = ({ isOpen, onClose, cashSession, closedByLabel, onConfirm }) => {
  const [countedInput, setCountedInput] = useState('');

  useEffect(() => {
    if (isOpen) setCountedInput('');
  }, [isOpen]);

  if (!cashSession) return null;

  const counted = parseFloat(countedInput);
  const hasValue = !isNaN(counted);
  const difference = hasValue ? round2(counted - cashSession.expectedCash) : 0;
  const isValid = hasValue && counted >= 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cerrar Caja y Hacer Arqueo" size="sm">
      <div className="p-3 rounded-3 mb-3 d-flex justify-content-between align-items-center" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border-color)' }}>
        <span className="fw-semibold" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Efectivo esperado en caja</span>
        <span className="fw-bold" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{formatMoney(cashSession.expectedCash)}</span>
      </div>
      <div className="mb-3">
        <label className="form-label fw-bold" htmlFor="efectivoContado">Efectivo Contado Físicamente</label>
        <div className="input-group">
          <span className="input-group-text">S/</span>
          <input
            id="efectivoContado"
            type="number"
            min={0}
            step="0.10"
            className="form-control"
            placeholder="0.00"
            autoFocus
            value={countedInput}
            onChange={e => setCountedInput(e.target.value)}
          />
        </div>
      </div>
      {hasValue && (
        <div
          className="p-2 rounded-3 d-flex justify-content-between align-items-center mb-3"
          style={{
            background: difference === 0 ? 'var(--color-emerald-bg)' : 'var(--color-rose-bg)',
            border: `1px solid ${difference === 0 ? '#6ee7b7' : '#fca5a5'}`,
          }}
        >
          <span className="fw-semibold" style={{ fontSize: '0.82rem', color: difference === 0 ? 'var(--color-emerald-text)' : 'var(--color-rose-text)' }}>
            {difference === 0 ? 'Cuadra exacto' : difference > 0 ? 'Sobrante de caja' : 'Faltante de caja'}
          </span>
          <span className="fw-bold" style={{ color: difference === 0 ? 'var(--color-emerald-text)' : 'var(--color-rose-text)' }}>
            {difference === 0 ? formatMoney(0) : formatMoney(Math.abs(difference))}
          </span>
        </div>
      )}
      <small className="d-block mb-3" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
        <i className="bi bi-person-badge me-1"></i>Cierre a nombre de: <strong>{closedByLabel}</strong>
      </small>
      <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-danger fw-semibold"
          style={{ borderRadius: 8 }}
          disabled={!isValid}
          onClick={() => { if (isValid) { onConfirm(round2(counted)); onClose(); } }}
        >
          <i className="bi bi-lock-fill me-1"></i>Cerrar Caja
        </button>
      </div>
    </Modal>
  );
};

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: 'ingreso_manual' | 'retiro_manual', amount: number, description: string) => void;
}

export const CashMovementModal: React.FC<CashMovementModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [type, setType] = useState<'ingreso_manual' | 'retiro_manual'>('ingreso_manual');
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setType('ingreso_manual');
      setAmountInput('');
      setDescription('');
    }
  }, [isOpen]);

  const amount = parseFloat(amountInput);
  const isValid = !isNaN(amount) && amount > 0 && description.trim().length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Movimiento Manual de Caja" size="sm">
      <div className="mb-3">
        <div className="d-flex gap-2">
          <button
            type="button"
            className={`btn flex-fill fw-semibold ${type === 'ingreso_manual' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
            style={{ borderRadius: 8, minHeight: 40 }}
            onClick={() => setType('ingreso_manual')}
          >
            <i className="bi bi-plus-circle me-1"></i>Ingreso
          </button>
          <button
            type="button"
            className={`btn flex-fill fw-semibold ${type === 'retiro_manual' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
            style={{ borderRadius: 8, minHeight: 40 }}
            onClick={() => setType('retiro_manual')}
          >
            <i className="bi bi-dash-circle me-1"></i>Retiro
          </button>
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="movMonto">Monto</label>
        <div className="input-group">
          <span className="input-group-text">S/</span>
          <input
            id="movMonto"
            type="number"
            min={0}
            step="0.10"
            className="form-control"
            placeholder="0.00"
            value={amountInput}
            onChange={e => setAmountInput(e.target.value)}
          />
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="movDesc">Motivo</label>
        <input
          id="movDesc"
          type="text"
          className="form-control"
          style={{ borderRadius: 8 }}
          placeholder={type === 'ingreso_manual' ? 'Ej. Cambio adicional del banco' : 'Ej. Pago a proveedor de emergencia'}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-brand btn fw-semibold"
          style={{ borderRadius: 8 }}
          disabled={!isValid}
          onClick={() => { if (isValid) { onConfirm(type, round2(amount), description.trim()); onClose(); } }}
        >
          <i className="bi bi-check-lg me-1"></i>Registrar
        </button>
      </div>
    </Modal>
  );
};

/* ─────────────────────────────────────────────────────────────
   ConfirmCheckoutModal — Confirmación previa al cobro (punto #20
   del análisis UX). Última pantalla antes de mover dinero de
   verdad: mesa, comprobante, cliente, desglose de pago y vuelto.
   ───────────────────────────────────────────────────────────── */
interface ConfirmCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: Order | undefined;
  comprobanteTipo: TipoComprobante;
  clienteLabel?: string;
  totalAmount: number;
  paymentBreakdown: PaymentSplitEntry[];
  cashDetail?: CashPaymentDetail;
}

export const ConfirmCheckoutModal: React.FC<ConfirmCheckoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  order,
  comprobanteTipo,
  clienteLabel,
  totalAmount,
  paymentBreakdown,
  cashDetail,
}) => {
  if (!isOpen || !order) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Cobro" size="sm">
      <div className="d-flex flex-column gap-3 mb-4">
        <div className="d-flex justify-content-between">
          <span style={{ color: 'var(--text-muted)' }}>Mesa</span>
          <span className="fw-bold">#{order.tableNumber} — {order.areaName}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span style={{ color: 'var(--text-muted)' }}>Comprobante</span>
          <Badge status={COMPROBANTE_LABELS[comprobanteTipo].toUpperCase()} variant="primary" />
        </div>
        {clienteLabel && (
          <div className="d-flex justify-content-between">
            <span style={{ color: 'var(--text-muted)' }}>Cliente</span>
            <span className="fw-semibold text-end" style={{ maxWidth: 220 }}>{clienteLabel}</span>
          </div>
        )}
        <div className="pt-2" style={{ borderTop: '1px dashed var(--border-color)' }}>
          {paymentBreakdown.map(p => (
            <div key={p.id} className="d-flex justify-content-between" style={{ fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                <i className={`bi ${getPaymentMethodMeta(p.method).icon} me-1`}></i>
                {getPaymentMethodMeta(p.method).label}
              </span>
              <span className="fw-semibold">{formatMoney(p.amount)}</span>
            </div>
          ))}
        </div>
        {cashDetail && (
          <div className="d-flex justify-content-between" style={{ fontSize: '0.85rem', color: 'var(--color-emerald-text)' }}>
            <span className="fw-semibold"><i className="bi bi-cash-coin me-1"></i>Vuelto</span>
            <span className="fw-bold">{formatMoney(cashDetail.changeGiven)}</span>
          </div>
        )}
        <div className="d-flex align-items-baseline justify-content-between pt-2" style={{ borderTop: '2px solid var(--border-color)' }}>
          <span style={{ fontWeight: 800 }}>TOTAL</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-brand)' }}>{formatMoney(totalAmount)}</span>
        </div>
      </div>
      <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>
          Volver
        </button>
        <button
          type="button"
          className="btn fw-bold"
          style={{ borderRadius: 8, background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none' }}
          onClick={() => { onConfirm(); onClose(); }}
        >
          <i className="bi bi-check-circle-fill me-2"></i>Confirmar y Cobrar
        </button>
      </div>
    </Modal>
  );
};

/* ─────────────────────────────────────────────────────────────
   ReopenSaleModal — Corrección de pago/comprobante de una venta
   ya cerrada, con motivo obligatorio (RF-61, punto #19 del
   análisis UX). No reemplaza una nota de crédito formal ante
   SUNAT para Boleta/Factura ya emitidas.
   ───────────────────────────────────────────────────────────── */
interface ReopenSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  clientes: Cliente[];
  onConfirm: (saleId: string, params: UpdateSalePaymentParams) => void;
}

export const ReopenSaleModal: React.FC<ReopenSaleModalProps> = ({ isOpen, onClose, sale, clientes, onConfirm }) => {
  const [comprobanteTipo, setComprobanteTipo] = useState<TipoComprobante>('boleta');
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('efectivo');
  const [cashReceivedInput, setCashReceivedInput] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen && sale) {
      setComprobanteTipo(sale.comprobanteTipo);
      setSelectedClienteId(sale.cliente?.id ?? '');
      setSelectedMethod(sale.paymentBreakdown[0]?.method ?? 'efectivo');
      setCashReceivedInput('');
      setReason('');
    }
  }, [isOpen, sale]);

  if (!sale) return null;

  const requiresCliente = comprobanteTipo === 'factura';
  const clienteObj = clientes.find(c => c.id === selectedClienteId);
  const isValid = reason.trim().length > 0 && (!requiresCliente || (!!clienteObj && clienteObj.tipoDocumento === 'RUC'));

  const handleConfirm = () => {
    if (!isValid) return;
    const paymentBreakdown: PaymentSplitEntry[] = [{ id: `pg-fix-${Date.now()}`, method: selectedMethod, amount: sale.total }];
    const cashReceived = parseFloat(cashReceivedInput);
    const cashDetail: CashPaymentDetail | undefined =
      selectedMethod === 'efectivo'
        ? { amountReceived: !isNaN(cashReceived) ? cashReceived : sale.total, changeGiven: round2(Math.max(0, (!isNaN(cashReceived) ? cashReceived : sale.total) - sale.total)) }
        : undefined;
    onConfirm(sale.id, {
      comprobanteTipo,
      cliente: comprobanteTipo === 'ticket' ? undefined : clienteObj,
      paymentBreakdown,
      cashDetail,
      reason: reason.trim(),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Corregir Venta ${sale.serie}-${sale.correlativo}`} size="md">
      <div className="p-2 rounded-3 mb-3 d-flex align-items-center gap-2" style={{ background: 'var(--color-amber-bg)', border: '1px solid #fcd34d' }}>
        <i className="bi bi-info-circle-fill" style={{ color: 'var(--color-amber-text)' }}></i>
        <small style={{ color: 'var(--color-amber-text)' }}>
          Esto corrige el comprobante o la forma de pago de una venta ya cobrada. El total ({formatMoney(sale.total)}) no cambia. No emite una nota de crédito ante SUNAT.
        </small>
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold">Tipo de Comprobante</label>
        <div className="d-flex gap-2">
          {(['ticket', 'boleta', 'factura'] as TipoComprobante[]).map(t => (
            <button
              key={t}
              type="button"
              className={`btn flex-fill fw-semibold ${comprobanteTipo === t ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
              style={{ borderRadius: 8, minHeight: 40 }}
              onClick={() => setComprobanteTipo(t)}
            >
              {COMPROBANTE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {comprobanteTipo !== 'ticket' && (
        <div className="mb-3">
          <label className="form-label" htmlFor="reopenCliente">Cliente {requiresCliente && <span className="text-danger">*</span>}</label>
          <select
            id="reopenCliente"
            className="form-select"
            value={selectedClienteId}
            onChange={e => setSelectedClienteId(e.target.value)}
          >
            <option value="">Consumidor Final</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.tipoDocumento} {c.numeroDocumento} — {c.nombreORazonSocial}</option>
            ))}
          </select>
          {requiresCliente && !clienteObj && (
            <small className="d-block mt-1 text-danger" style={{ fontSize: '0.75rem' }}>Una factura requiere un cliente con RUC.</small>
          )}
        </div>
      )}

      <div className="mb-3">
        <label className="form-label fw-bold" htmlFor="reopenMetodo">Forma de Pago Correcta</label>
        <select
          id="reopenMetodo"
          className="form-select"
          value={selectedMethod}
          onChange={e => setSelectedMethod(e.target.value as PaymentMethodType)}
        >
          {PAYMENT_METHODS.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      {selectedMethod === 'efectivo' && (
        <div className="mb-3">
          <label className="form-label" htmlFor="reopenRecibido">Monto Recibido en Efectivo</label>
          <div className="input-group">
            <span className="input-group-text">S/</span>
            <input
              id="reopenRecibido"
              type="number"
              min={0}
              step="0.10"
              className="form-control"
              placeholder={sale.total.toFixed(2)}
              value={cashReceivedInput}
              onChange={e => setCashReceivedInput(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="mb-3">
        <label className="form-label fw-bold" htmlFor="reopenMotivo">Motivo de la Corrección <span className="text-danger">*</span></label>
        <textarea
          id="reopenMotivo"
          className="form-control"
          style={{ borderRadius: 8 }}
          rows={2}
          placeholder="Ej. El cliente indicó que pagó con Visa, no en efectivo"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
      </div>

      <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }} disabled={!isValid} onClick={handleConfirm}>
          <i className="bi bi-arrow-repeat me-1"></i>Guardar Corrección
        </button>
      </div>
    </Modal>
  );
};

/* ─────────────────────────────────────────────────────────────
   ReceiptModal — Vista e impresión de comprobante de venta
   (RF-61, punto #18 del análisis UX). Incluye serie/correlativo,
   cliente, cajero, desglose real de pago, vuelto y estado.
   ───────────────────────────────────────────────────────────── */
interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
  restaurantName: string;
  restaurantRuc: string;
  restaurantAddress: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose, restaurantName, restaurantRuc, restaurantAddress }) => {
  if (!sale) return null;

  const estadoBadge = sale.isCancelled
    ? { text: 'ANULADA', variant: 'danger' as const }
    : sale.estadoPago === 'facturada'
    ? { text: 'FACTURADA', variant: 'primary' as const }
    : { text: 'PAGADA', variant: 'success' as const };

  return (
    <Modal isOpen={!!sale} onClose={onClose} title={`Comprobante ${sale.serie}-${String(sale.correlativo).padStart(4, '0')}`} size="sm">
      <div
        className="p-3 rounded-3"
        style={{ fontFamily: 'monospace', background: '#fafafa', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
      >
        <div className="text-center mb-1">
          <div className="fw-bold" style={{ fontSize: '1rem' }}>{restaurantName}</div>
          <div style={{ color: 'var(--text-muted)' }}>RUC {restaurantRuc}</div>
          <div style={{ color: 'var(--text-muted)' }}>{restaurantAddress}</div>
        </div>
        <hr className="my-2" />
        <div className="text-center mb-1">
          <div className="fw-bold" style={{ fontSize: '0.95rem' }}>{COMPROBANTE_LABELS[sale.comprobanteTipo].toUpperCase()} ELECTRÓNIC{sale.comprobanteTipo === 'boleta' ? 'A' : 'O'}</div>
          <div>{sale.serie}-{String(sale.correlativo).padStart(4, '0')}</div>
        </div>
        <hr className="my-2" />
        <div className="d-flex justify-content-between"><span>Mesa:</span><span>#{sale.tableNumber}</span></div>
        <div className="d-flex justify-content-between"><span>Fecha:</span><span>{sale.closedAt}</span></div>
        <div className="d-flex justify-content-between"><span>Mesero:</span><span>{sale.waiterName}</span></div>
        <div className="d-flex justify-content-between"><span>Cajero:</span><span>{sale.cashierName}</span></div>
        {sale.cliente && (
          <>
            <hr className="my-2" />
            <div className="d-flex justify-content-between"><span>{sale.cliente.tipoDocumento}:</span><span>{sale.cliente.numeroDocumento}</span></div>
            <div className="text-truncate">{sale.cliente.nombreORazonSocial}</div>
            {sale.cliente.direccion && <div className="text-truncate" style={{ color: 'var(--text-muted)' }}>{sale.cliente.direccion}</div>}
          </>
        )}
        <hr className="my-2" />
        <div className="d-flex flex-column gap-1 text-start mb-2">
          {sale.items.map((it, idx) => (
            <div key={idx} className="d-flex justify-content-between">
              <span>{it.quantity}x {it.dishName}</span>
              <span>S/ {(it.price * it.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <hr className="my-2" />
        <div className="d-flex justify-content-between"><span>Subtotal:</span><span>{formatMoney(sale.subtotal)}</span></div>
        {sale.discountAmount > 0 && (
          <div className="d-flex justify-content-between"><span>{sale.discountLabel ?? 'Descuento'}:</span><span>-{formatMoney(sale.discountAmount)}</span></div>
        )}
        <div className="d-flex justify-content-between"><span>IGV ({sale.igvPercent}%):</span><span>{formatMoney(sale.taxAmount)}</span></div>
        {sale.tipAmount > 0 && (
          <div className="d-flex justify-content-between"><span>Propina:</span><span>{formatMoney(sale.tipAmount)}</span></div>
        )}
        {sale.roundingAdjustment !== 0 && (
          <div className="d-flex justify-content-between"><span>Redondeo:</span><span>{formatMoney(sale.roundingAdjustment)}</span></div>
        )}
        <div className="d-flex justify-content-between fw-bold" style={{ fontSize: '1rem', marginTop: 4 }}>
          <span>TOTAL:</span><span>{formatMoney(sale.total)}</span>
        </div>
        <hr className="my-2" />
        <div className="text-start mb-1">
          {sale.paymentBreakdown.map(p => (
            <div key={p.id} className="d-flex justify-content-between">
              <span>{getPaymentMethodMeta(p.method).label}:</span><span>{formatMoney(p.amount)}</span>
            </div>
          ))}
          {sale.cashDetail && (
            <>
              <div className="d-flex justify-content-between"><span>Recibido:</span><span>{formatMoney(sale.cashDetail.amountReceived)}</span></div>
              <div className="d-flex justify-content-between"><span>Vuelto:</span><span>{formatMoney(sale.cashDetail.changeGiven)}</span></div>
            </>
          )}
        </div>
        <hr className="my-2" />
        <div className="d-flex justify-content-center mb-1">
          <Badge status={estadoBadge.text} variant={estadoBadge.variant} />
        </div>
        {sale.isCancelled && sale.cancellationReason && (
          <div className="text-center" style={{ color: 'var(--color-rose-text)', fontSize: '0.72rem' }}>Motivo: {sale.cancellationReason}</div>
        )}
        {sale.editedAt && (
          <div className="text-center" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            Corregida el {sale.editedAt}{sale.editReason ? ` · ${sale.editReason}` : ''}
          </div>
        )}
        <div className="text-center mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          <i className="bi bi-qr-code me-1"></i>Válido como comprobante ante SUNAT
        </div>
        <div className="text-center" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>¡Gracias por su preferencia!</div>
      </div>
      <div className="d-flex justify-content-end gap-2 mt-3 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>
          Cerrar
        </button>
        <button type="button" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }} onClick={() => alert('Comprobante enviado a impresora POS.')}>
          <i className="bi bi-printer me-1"></i> Imprimir
        </button>
      </div>
    </Modal>
  );
};
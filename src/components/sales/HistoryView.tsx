import React from 'react';
import type { Sale, CashSession } from '../../types';
import { StatCard } from '../common/StatCard';
import { SectionCard } from '../common/SectionCard';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { SearchBar } from '../common/SearchBar';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';
import { CashSessionBar } from './CashSessionBar';
import { formatMoney } from '../../utils/money';
import { CATEGORY_LABELS, CATEGORY_COLOR_VARIANTS, CATEGORY_BADGE_VARIANTS } from '../../utils/payments';
import type { PaymentMethod } from '../../types';

interface HistoryViewProps {
  isAdmin: boolean;

  // Caja — resumen del turno actual + turnos cerrados anteriores
  cashSession: CashSession | null;
  onOpenCashSession: () => void;
  onCloseCashSession: () => void;
  onCashMovement: () => void;
  cashSessionHistory: CashSession[];

  validSalesCount: number;
  totalSalesSum: number;
  averageTicket: number;
  cancelledCount: number;
  topDishes: [string, number][];

  filteredSales: Sale[];

  filterDate: string;
  setFilterDate: (val: string) => void;
  filterPaymentMethod: string;
  setFilterPaymentMethod: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterSearch: string;
  setFilterSearch: (val: string) => void;
  onClearFilters: () => void;

  onOpenReceipt: (sale: Sale) => void;
  onOpenReopen: (sale: Sale) => void;
  onOpenCancel: (sale: Sale) => void;
  onExportReport: () => void;
}

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'Todas las formas de pago', icon: 'bi-wallet2', colorVariant: 'secondary' },
  ...(Object.keys(CATEGORY_LABELS) as PaymentMethod[])
    .filter(cat => cat !== 'mixto')
    .map(cat => ({
      value: cat,
      label: CATEGORY_LABELS[cat],
      icon: cat === 'efectivo' ? 'bi-cash' : cat === 'tarjeta' ? 'bi-credit-card' : cat === 'billetera' ? 'bi-phone-fill' : cat === 'transferencia' ? 'bi-bank2' : 'bi-three-dots',
      colorVariant: CATEGORY_COLOR_VARIANTS[cat],
    })),
  { value: 'mixto', label: 'Mixto', icon: 'bi-wallet2', colorVariant: CATEGORY_COLOR_VARIANTS.mixto },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados', icon: 'bi-list-check', colorVariant: 'secondary' },
  { value: 'cerrada', label: 'Cerradas', icon: 'bi-check-circle-fill', colorVariant: 'success' },
  { value: 'anulada', label: 'Anuladas', icon: 'bi-x-circle-fill', colorVariant: 'danger' },
];

/**
 * HistoryView — Tab "Historial" de SalesPage.
 * KPIs de ventas, resumen de caja del turno, ranking de platos, filtros de
 * búsqueda y el listado de comprobantes (tabla en desktop/tablet, tarjetas
 * apiladas en móvil), con la corrección de venta y el cierre de turno
 * disponibles para el Administrador.
 */
export const HistoryView: React.FC<HistoryViewProps> = ({
  isAdmin,
  cashSession,
  onOpenCashSession,
  onCloseCashSession,
  onCashMovement,
  cashSessionHistory,
  validSalesCount,
  totalSalesSum,
  averageTicket,
  cancelledCount,
  topDishes,
  filteredSales,
  filterDate,
  setFilterDate,
  filterPaymentMethod,
  setFilterPaymentMethod,
  filterStatus,
  setFilterStatus,
  filterSearch,
  setFilterSearch,
  onClearFilters,
  onOpenReceipt,
  onOpenReopen,
  onOpenCancel,
  onExportReport,
}) => {
  const hasActiveFilters = !!(filterDate || filterPaymentMethod || filterStatus || filterSearch);

  return (
    <div className="d-flex flex-column gap-4">
      {/* Resumen del turno de caja actual */}
      <CashSessionBar
        cashSession={cashSession}
        variant="summary"
        onOpenClick={onOpenCashSession}
        onCloseClick={onCloseCashSession}
        onMovementClick={onCashMovement}
      />

      {/* Stats KPIs RF-63 */}
      <div className="row g-3 stagger-children">
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Total Ventas Consolidadas"
            value={formatMoney(totalSalesSum)}
            subtitle={`${validSalesCount} transacciones registradas`}
            icon="bi-cash-stack"
            colorTheme="emerald"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Ticket Promedio por Mesa"
            value={formatMoney(averageTicket)}
            subtitle="Consumo medio por comanda"
            icon="bi-receipt"
            colorTheme="indigo"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Ventas Anuladas"
            value={cancelledCount}
            subtitle="Comprobantes cancelados"
            icon="bi-x-circle"
            colorTheme="rose"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Platos Más Vendidos"
            value={topDishes[0]?.[0] ?? '—'}
            subtitle={topDishes[0] ? `${topDishes[0][1]} unidades` : 'Sin datos'}
            icon="bi-star-fill"
            colorTheme="amber"
          />
        </div>
      </div>

      {/* Top dishes RF-63 */}
      {topDishes.length > 0 && (
        <SectionCard icon="bi-trophy-fill" title="Platos Más Vendidos">
          <div className="d-flex flex-column gap-2">
            {topDishes.map(([dish, qty], i) => {
              const max = topDishes[0][1];
              const pct = Math.round((qty / max) * 100);
              return (
                <div key={i} className="d-flex align-items-center gap-3">
                  <div className={`top-dish-rank${i === 0 ? ' is-first' : ''}`}>
                    {i + 1}
                  </div>
                  <div className="top-dish-info">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-truncate top-dish-name">
                        {dish}
                      </span>
                      <span className="flex-shrink-0 ms-2 top-dish-qty">
                        {qty} un.
                      </span>
                    </div>
                    <div className="progress top-dish-progress">
                      <div
                        className={`progress-bar top-dish-progress-bar ${i === 0 ? 'is-rank-0' : i === 1 ? 'is-rank-1' : 'is-rank-rest'}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Filtros — RF-63, reorganizados como herramienta de análisis */}
      <SectionCard icon="bi-funnel" title="Filtros de Historial">
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <label className="filter-label" htmlFor="filterSearch">Buscar</label>
            <SearchBar
              value={filterSearch}
              onChange={setFilterSearch}
              placeholder="N° comprobante, mesa o mesero…"
            />
          </div>
          <div className="col-6 col-lg-3">
            <label id="filterPaymentLabel" className="filter-label">Forma de pago</label>
            <CustomDropdownSelect
              id="filterPayment"
              labelId="filterPaymentLabel"
              value={filterPaymentMethod}
              onChange={setFilterPaymentMethod}
              options={PAYMENT_METHOD_OPTIONS}
            />
          </div>
          <div className="col-6 col-lg-3">
            <label id="filterStatusLabel" className="filter-label">Estado</label>
            <CustomDropdownSelect
              id="filterStatus"
              labelId="filterStatusLabel"
              value={filterStatus}
              onChange={setFilterStatus}
              options={STATUS_OPTIONS}
            />
          </div>
          <div className="col-12 col-lg-2">
            <label className="filter-label" htmlFor="filterDateInput">Fecha</label>
            <input
              id="filterDateInput"
              type="date"
              className="form-control rounded-3"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
            />
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3 pt-3 history-filters-footer">
          <span className="badge rounded-pill text-bg-light border history-results-badge">
            {filteredSales.length} resultado{filteredSales.length !== 1 ? 's' : ''}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-sm btn-link text-muted text-decoration-none p-0 fw-semibold"
              onClick={onClearFilters}
            >
              <i className="bi bi-x-circle me-1"></i>Limpiar filtros
            </button>
          )}
        </div>
      </SectionCard>

      {/* Listado de comprobantes */}
      <SectionCard
        icon="bi-list-ul"
        title="Historial de Ventas"
        noPadding
        actions={
          isAdmin && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary fw-semibold rounded-3 history-export-btn"
              onClick={onExportReport}
            >
              <i className="bi bi-download me-1"></i> Exportar
            </button>
          )
        }
      >
        {filteredSales.length === 0 ? (
          <div className="py-3">
            <EmptyState icon="bi-graph-down" title="Sin ventas registradas" description="No hay ventas que coincidan con los filtros seleccionados." />
          </div>
        ) : (
          <>
            {/* Móvil: listado de tarjetas — evita el scroll horizontal de una tabla de 8 columnas */}
            <div className="d-lg-none d-flex flex-column gap-2 p-3">
              {filteredSales.map(sale => (
                <div
                  key={sale.id}
                  className="p-3 rounded-3 history-sale-card"
                >
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                    <span
                      className="text-truncate history-sale-card-code"
                    >
                      {sale.serie}-{String(sale.correlativo).padStart(4, '0')}
                    </span>
                    <div className="flex-shrink-0">
                      <Badge status={sale.isCancelled ? 'ANULADA' : sale.estadoPago === 'facturada' ? 'FACTURADA' : 'PAGADA'} variant={sale.isCancelled ? 'danger' : sale.estadoPago === 'facturada' ? 'primary' : 'success'} />
                    </div>
                  </div>

                  <div className="d-flex align-items-baseline justify-content-between gap-2">
                    <span className="fw-bold history-sale-card-table">
                      Mesa #{sale.tableNumber}
                    </span>
                    <span className="history-sale-card-total">
                      {formatMoney(sale.total)}
                    </span>
                  </div>

                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-1 history-sale-card-meta">
                    <span className="text-truncate"><i className="bi bi-person me-1"></i>{sale.waiterName}</span>
                    <span className="flex-shrink-0">{sale.closedAt}</span>
                  </div>

                  <div
                    className="d-flex align-items-center justify-content-between gap-2 mt-2 pt-2 history-sale-card-footer"
                  >
                    <Badge status={CATEGORY_LABELS[sale.paymentMethod]} variant={CATEGORY_BADGE_VARIANTS[sale.paymentMethod]} />
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary fw-semibold rounded-3 history-sale-card-btn"
                        aria-label={`Ver comprobante ${sale.id}`}
                        onClick={() => onOpenReceipt(sale)}
                      >
                        <i className="bi bi-printer-fill me-1"></i>Ver
                      </button>
                      {isAdmin && !sale.isCancelled && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary rounded-3 history-sale-card-btn"
                            aria-label={`Corregir venta ${sale.id}`}
                            onClick={() => onOpenReopen(sale)}
                          >
                            <i className="bi bi-arrow-repeat"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-3 history-sale-card-btn"
                            aria-label={`Anular venta ${sale.id}`}
                            onClick={() => onOpenCancel(sale)}
                          >
                            <i className="bi bi-x-circle-fill"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet / Desktop: tabla tradicional */}
            <div className="d-none d-lg-block table-responsive-x">
              <table className="custom-table history-table">
                <thead>
                  <tr>
                    <th>N° Comprobante</th>
                    <th>Mesa</th>
                    <th>Atendido por</th>
                    <th>Fecha y Hora</th>
                    <th>Forma Pago</th>
                    <th className="text-end">Total</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(sale => (
                    <tr key={sale.id}>
                      <td>
                        <span className="history-table-code">
                          {sale.serie}-{String(sale.correlativo).padStart(4, '0')}
                        </span>
                      </td>
                      <td className="fw-bold history-table-mesa">
                        Mesa #{sale.tableNumber}
                      </td>
                      <td className="history-table-muted-sm">{sale.waiterName}</td>
                      <td className="history-table-muted-xs">{sale.closedAt}</td>
                      <td>
                        <Badge status={CATEGORY_LABELS[sale.paymentMethod]} variant={CATEGORY_BADGE_VARIANTS[sale.paymentMethod]} />
                      </td>
                      <td className="text-end fw-bold history-table-total">
                        {formatMoney(sale.total)}
                      </td>
                      <td>
                        <Badge
                          status={sale.isCancelled ? 'ANULADA' : sale.estadoPago === 'facturada' ? 'FACTURADA' : 'PAGADA'}
                          variant={sale.isCancelled ? 'danger' : sale.estadoPago === 'facturada' ? 'primary' : 'success'}
                        />
                        {sale.editedAt && !sale.isCancelled && (
                          <div className="history-table-corrected-note">
                            <i className="bi bi-pencil-fill me-1"></i>Corregida
                          </div>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-1">
                          <button
                            type="button"
                            className="btn-icon btn-icon-primary"
                            title="Ver / Imprimir Comprobante"
                            aria-label={`Ver comprobante ${sale.id}`}
                            onClick={() => onOpenReceipt(sale)}
                          >
                            <i className="bi bi-printer-fill"></i>
                          </button>
                          {isAdmin && !sale.isCancelled && (
                            <>
                              <button
                                type="button"
                                className="btn-icon"
                                title="Corregir Comprobante / Forma de Pago"
                                aria-label={`Corregir venta ${sale.id}`}
                                onClick={() => onOpenReopen(sale)}
                              >
                                <i className="bi bi-arrow-repeat"></i>
                              </button>
                              <button
                                type="button"
                                className="btn-icon btn-icon-danger"
                                title="Anular Venta"
                                aria-label={`Anular venta ${sale.id}`}
                                onClick={() => onOpenCancel(sale)}
                              >
                                <i className="bi bi-x-circle-fill"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SectionCard>

      {/* Turnos de caja anteriores — visibilidad de arqueo (solo Admin) */}
      {isAdmin && cashSessionHistory.length > 0 && (
        <SectionCard icon="bi-archive" title="Turnos de Caja Anteriores" noPadding>
          <div className="table-responsive-x">
            <table className="custom-table history-sessions-table">
              <thead>
                <tr>
                  <th>Turno</th>
                  <th>Responsable</th>
                  <th className="text-end">Fondo Inicial</th>
                  <th className="text-end">Esperado</th>
                  <th className="text-end">Contado</th>
                  <th className="text-end">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {cashSessionHistory.map(session => (
                  <tr key={session.id}>
                    <td>
                      <div className="fw-semibold session-history-opened-at">{session.openedAt}</div>
                      <div className="session-history-closed-at">hasta {session.closedAt}</div>
                    </td>
                    <td className="history-table-muted-sm">{session.openedBy}</td>
                    <td className="text-end">{formatMoney(session.initialAmount)}</td>
                    <td className="text-end">{formatMoney(session.expectedCash)}</td>
                    <td className="text-end fw-semibold">{formatMoney(session.countedCash ?? 0)}</td>
                    <td className="text-end">
                      <Badge
                        status={!session.difference ? 'Cuadrado' : session.difference > 0 ? `+${formatMoney(session.difference)}` : formatMoney(session.difference)}
                        variant={!session.difference ? 'success' : 'danger'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
};

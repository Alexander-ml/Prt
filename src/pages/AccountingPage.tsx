import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';

export const AccountingPage: React.FC = () => {
  const {
    ledgerEntries,
    financialSummary,
    addLedgerEntry,
    currentRole,
  } = useApp();

  const [periodFilter, setPeriodFilter] = useState('este_mes');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'egreso' as 'ingreso' | 'egreso',
    category: 'Insumos & Proveedores',
    description: '',
    amount: 150,
    reference: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) return;
    addLedgerEntry({
      date: new Date().toISOString().split('T')[0],
      type: formData.type,
      category: formData.category,
      description: formData.description,
      amount: Number(formData.amount),
      reference: formData.reference,
    });
    setIsModalOpen(false);
  };

  if (currentRole !== 'Administrador') {
    return (
      <div className="container-fluid p-0">
        <EmptyState
          icon="bi-journal-text"
          title="Acceso Restringido"
          description="La contabilidad formal es gestionada exclusivamente por el Administrador."
        />
      </div>
    );
  }

  // Margin percentage
  const marginPct = financialSummary.totalRevenue > 0
    ? Math.round((financialSummary.netProfit / financialSummary.totalRevenue) * 100)
    : 0;

  return (
    <div className="container-fluid p-0">
      <PageHeader
        icon="bi-journal-text"
        title="Contabilidad Formal"
        subtitle="Resumen financiero derivado de ventas, ingresos y egresos del período (RF-73 – RF-75)."
        actions={
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-primary fw-semibold"
              style={{ borderRadius: 8 }}
              onClick={() => alert('RF-75: Información contable exportada en Excel/CSV.')}
            >
              <i className="bi bi-download me-1"></i> Exportar (RF-75)
            </button>
            <button
              className="btn-brand btn btn-sm fw-semibold"
              style={{ borderRadius: 8 }}
              onClick={() => setIsModalOpen(true)}
            >
              <i className="bi bi-plus-lg me-1"></i> Nuevo Asiento
            </button>
          </div>
        }
      />

      {/* Financial Summary KPIs RF-73 */}
      <div className="row g-3 mb-4 stagger-children">
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Ingresos Totales"
            value={`S/ ${financialSummary.totalRevenue.toFixed(2)}`}
            subtitle={financialSummary.period}
            icon="bi-arrow-down-left-circle-fill"
            colorTheme="emerald"
            trend={{ value: '+18%', positive: true }}
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Egresos Registrados"
            value={`S/ ${financialSummary.totalExpenses.toFixed(2)}`}
            subtitle="Gastos de operación del período"
            icon="bi-arrow-up-right-circle-fill"
            colorTheme="rose"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="Utilidad Neta Estimada"
            value={`S/ ${financialSummary.netProfit.toFixed(2)}`}
            subtitle={`Margen neto: ${marginPct}%`}
            icon="bi-graph-up-arrow"
            colorTheme="indigo"
            trend={{ value: `${marginPct}% margen`, positive: marginPct > 30 }}
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            title="IGV Recaudado"
            value={`S/ ${financialSummary.taxCollected.toFixed(2)}`}
            subtitle="18% sobre comprobantes emitidos"
            icon="bi-file-earmark-text-fill"
            colorTheme="amber"
          />
        </div>
      </div>

      {/* Revenue vs Expenses visual bar RF-73 */}
      <SectionCard icon="bi-bar-chart-fill" title="Distribución Financiera del Período" className="mb-4">
        <div className="d-flex flex-column gap-3">
          <div>
            <div className="d-flex justify-content-between mb-1">
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-emerald)' }}>
                <i className="bi bi-arrow-down-left me-1"></i>Ingresos Operativos
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                S/ {financialSummary.totalRevenue.toFixed(2)}
              </span>
            </div>
            <div className="progress" style={{ height: 10, borderRadius: 99 }}>
              <div className="progress-bar bg-success" style={{ width: '100%', borderRadius: 99 }}></div>
            </div>
          </div>
          <div>
            <div className="d-flex justify-content-between mb-1">
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-rose)' }}>
                <i className="bi bi-arrow-up-right me-1"></i>Egresos y Gastos
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                S/ {financialSummary.totalExpenses.toFixed(2)}
              </span>
            </div>
            <div className="progress" style={{ height: 10, borderRadius: 99 }}>
              <div
                className="progress-bar bg-danger"
                style={{
                  width: financialSummary.totalRevenue > 0
                    ? `${(financialSummary.totalExpenses / financialSummary.totalRevenue) * 100}%`
                    : '0%',
                  borderRadius: 99,
                }}
              ></div>
            </div>
          </div>
          <div>
            <div className="d-flex justify-content-between mb-1">
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-brand)' }}>
                <i className="bi bi-stars me-1"></i>Utilidad Neta
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                S/ {financialSummary.netProfit.toFixed(2)}
              </span>
            </div>
            <div className="progress" style={{ height: 10, borderRadius: 99 }}>
              <div
                className="progress-bar"
                style={{
                  width: `${marginPct}%`,
                  background: 'linear-gradient(90deg, #4f46e5, #818cf8)',
                  borderRadius: 99,
                  transition: 'width 0.5s ease',
                }}
              ></div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Ledger Detail RF-74 */}
      <SectionCard
        icon="bi-list-columns"
        title="Detalle de Ingresos y Egresos (RF-74)"
        actions={
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0" style={{ fontSize: '0.8rem' }}>Período:</label>
            <select
              className="form-select form-select-sm"
              style={{ borderRadius: 8, width: 'auto' }}
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)}
            >
              <option value="este_mes">Julio 2026</option>
              <option value="mes_anterior">Junio 2026</option>
              <option value="anio_actual">Año 2026</option>
            </select>
          </div>
        }
      >
        <div className="table-responsive-x">
          <table className="custom-table" style={{ minWidth: 650 }}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Referencia</th>
                <th className="text-end">Monto (S/)</th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.map(entry => (
                <tr key={entry.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {entry.date}
                  </td>
                  <td>
                    <Badge
                      status={entry.type === 'ingreso' ? 'INGRESO' : 'EGRESO'}
                      variant={entry.type === 'ingreso' ? 'success' : 'danger'}
                    />
                  </td>
                  <td className="fw-semibold" style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                    {entry.category}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{entry.description}</td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {entry.reference}
                    </span>
                  </td>
                  <td className="text-end fw-bold" style={{
                    fontSize: '0.95rem',
                    color: entry.type === 'ingreso' ? 'var(--color-emerald)' : 'var(--color-rose)',
                  }}>
                    {entry.type === 'ingreso' ? '+' : '−'} S/ {entry.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ledgerEntries.length === 0 && (
            <EmptyState icon="bi-journal" title="Sin asientos registrados" description="No hay movimientos contables en el período seleccionado." />
          )}
        </div>
      </SectionCard>

      {/* Ledger Entry Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Asiento Contable">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Tipo de Registro *</label>
            <div className="d-flex gap-2">
              <button
                type="button"
                className={`btn flex-grow-1 fw-semibold ${formData.type === 'ingreso' ? 'btn-success' : 'btn-outline-success'}`}
                style={{ borderRadius: 8 }}
                onClick={() => setFormData({ ...formData, type: 'ingreso', category: 'Ventas Restobar' })}
              >
                <i className="bi bi-arrow-down-left-circle me-1"></i> Ingreso
              </button>
              <button
                type="button"
                className={`btn flex-grow-1 fw-semibold ${formData.type === 'egreso' ? 'btn-danger' : 'btn-outline-danger'}`}
                style={{ borderRadius: 8 }}
                onClick={() => setFormData({ ...formData, type: 'egreso', category: 'Insumos & Proveedores' })}
              >
                <i className="bi bi-arrow-up-right-circle me-1"></i> Egreso
              </button>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Categoría *</label>
            <input
              type="text"
              className="form-control"
              style={{ borderRadius: 8 }}
              placeholder="Ej. Insumos, Servicios Básicos, Mantenimiento"
              required
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Descripción *</label>
            <input
              type="text"
              className="form-control"
              style={{ borderRadius: 8 }}
              placeholder="Ej. Pago factura de verduras frescas"
              required
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="row g-3 mb-4">
            <div className="col-6">
              <label className="form-label">Monto (S/) *</label>
              <input
                type="number" step="0.5" min="0.1"
                className="form-control"
                style={{ borderRadius: 8 }}
                required
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="col-6">
              <label className="form-label">Referencia / Comprobante</label>
              <input
                type="text"
                className="form-control"
                style={{ borderRadius: 8 }}
                value={formData.reference}
                onChange={e => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }}>
              Guardar Asiento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

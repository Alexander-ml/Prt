import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { Table } from '../../types';
import { SectionCard } from '../common/SectionCard';
import { StatCard } from '../common/StatCard';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';
import { TableCard } from './TableCard';
import { TABLE_STATUS_META } from './tableStatusMeta';

/**
 * TablesFloorplanView — Plano interactivo de sala (RF-32 a RF-38).
 * Usuario principal: Mesero / Administrador durante el servicio.
 * Pregunta que responde en los próximos 5 segundos: "¿qué mesas tengo
 * disponibles ahora mismo y qué necesito hacer con las que no lo están?"
 */
export const TablesFloorplanView: React.FC = () => {
  const {
    areas,
    tables,
    orders,
    occupyTable,
    registerTableReservation,
    changeTableStatus,
    joinTables,
    transferTableOrder,
  } = useApp();

  const navigate = useNavigate();

  // Filters (RF-33)
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('todas');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');

  // Selected Table for action modal
  const [selectedTableForAction, setSelectedTableForAction] = useState<Table | null>(null);

  // Reservation Modal state (RF-35)
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [resName, setResName] = useState('');
  const [resTime, setResTime] = useState('20:30');

  // Join Tables Modal state (RF-37)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [targetJoinTableId, setTargetJoinTableId] = useState('');

  // Transfer Order Modal state (RF-38)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetTransferTableId, setTargetTransferTableId] = useState('');

  // Filtered Tables (RF-32, RF-33)
  const filteredTables = useMemo(() => {
    return tables.filter(table => {
      const matchesArea = selectedAreaFilter === 'todas' || table.areaId === selectedAreaFilter;
      const matchesStatus = selectedStatusFilter === 'todos' || table.status === selectedStatusFilter;
      return matchesArea && matchesStatus;
    });
  }, [tables, selectedAreaFilter, selectedStatusFilter]);

  const handleReserveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableForAction || !resName.trim()) return;
    registerTableReservation(selectedTableForAction.id, resName, resTime);
    setIsReserveModalOpen(false);
    setSelectedTableForAction(null);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableForAction || !targetJoinTableId) return;
    joinTables(selectedTableForAction.id, targetJoinTableId);
    setIsJoinModalOpen(false);
    setSelectedTableForAction(null);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableForAction || !targetTransferTableId) return;
    transferTableOrder(selectedTableForAction.id, targetTransferTableId);
    setIsTransferModalOpen(false);
    setSelectedTableForAction(null);
  };

  const resetFilters = () => {
    setSelectedAreaFilter('todas');
    setSelectedStatusFilter('todos');
  };

  const availableCount = tables.filter(t => t.status === 'disponible').length;
  const occupiedCount = tables.filter(t => t.status === 'ocupada').length;
  const reservedCount = tables.filter(t => t.status === 'reservada').length;
  // Igual fórmula que usa DashboardPage para el % de ocupación: se reutiliza,
  // no se inventa un nuevo cálculo.
  const occupancyPct = tables.length > 0 ? Math.round((occupiedCount / tables.length) * 100) : 0;

  return (
    <>
      {/* StatCards Row — mismo grid de breakpoints que DashboardPage (col-md-6 col-lg-3) */}
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-3 mb-4 stagger-children">
        <div className="col">
          <StatCard
            title="Total Mesas"
            value={tables.length}
            subtitle={`${areas.length} áreas registradas`}
            icon="bi-table"
            colorTheme="indigo"
          />
        </div>
        <div className="col">
          <StatCard
            title="Disponibles"
            value={availableCount}
            subtitle="Listas para clientes"
            icon="bi-check-circle-fill"
            colorTheme="emerald"
          />
        </div>
        <div className="col">
          <StatCard
            title="Ocupadas"
            value={occupiedCount}
            subtitle="Con pedido en consumo"
            icon="bi-people-fill"
            colorTheme="rose"
            trend={{ value: `${occupancyPct}% ocupación`, positive: occupancyPct < 90 }}
          />
        </div>
        <div className="col">
          <StatCard
            title="Reservadas"
            value={reservedCount}
            subtitle="Turnos agendados hoy"
            icon="bi-bookmark-star-fill"
            colorTheme="amber"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <SectionCard icon="bi-funnel" title="Filtros del Plano de Sala" className="mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label htmlFor="areaFilterSelect" id="areaFilterLabel" className="form-label small fw-semibold text-muted text-uppercase mb-1">
              <i className="bi bi-geo-alt-fill me-1" aria-hidden="true"></i>
              Área
            </label>
            <CustomDropdownSelect
              id="areaFilterSelect"
              labelId="areaFilterLabel"
              value={selectedAreaFilter}
              onChange={setSelectedAreaFilter}
              size="sm"
              options={[
                { value: 'todas', label: `Todas las Áreas (${tables.length})`, icon: 'bi-grid-fill', colorVariant: 'secondary' },
                ...areas.map(area => ({
                  value: area.id,
                  label: `${area.name} (${tables.filter(t => t.areaId === area.id).length})`,
                  icon: 'bi-geo-alt-fill',
                  colorVariant: 'primary',
                })),
              ]}
            />
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="statusFilterSelect" id="statusFilterLabel" className="form-label small fw-semibold text-muted text-uppercase mb-1">
              <i className="bi bi-funnel-fill me-1" aria-hidden="true"></i>
              Estado
            </label>
            <CustomDropdownSelect
              id="statusFilterSelect"
              labelId="statusFilterLabel"
              value={selectedStatusFilter}
              onChange={setSelectedStatusFilter}
              size="sm"
              options={[
                { value: 'todos', label: 'Todos los Estados', icon: 'bi-grid-fill', colorVariant: 'secondary' },
                ...Object.entries(TABLE_STATUS_META).map(([status, meta]) => ({
                  value: status,
                  label: meta.label + 's',
                  icon: meta.icon,
                  colorVariant: meta.colorVariant,
                })),
              ]}
            />
          </div>
        </div>
      </SectionCard>

      {/* Interactive Floorplan Grid (RF-32) */}
       {filteredTables.length === 0 ? (
        <div className="mb-4">
          <EmptyState
            icon="bi-table"
            title="No hay mesas que coincidan"
            description="Ajusta los filtros de área o estado para ver más resultados del plano de sala."
            action={
              <button type="button" className="btn btn-outline-secondary btn-sm fw-semibold" onClick={resetFilters}>
                <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>
                Limpiar Filtros
              </button>
            }
          />
        </div>
      ) : (
        <div className="row g-3 mb-4 stagger-children">
          {filteredTables.map(table => {
            const activeOrder = orders.find(
              o => o.id === table.currentOrderId || (o.tableId === table.id && o.status !== 'cerrado')
            );
            return (
              <div key={table.id} className="col-12 col-sm-6 col-md-4 col-xl-3">
                <TableCard table={table} activeOrder={activeOrder} onClick={() => setSelectedTableForAction(table)} />
              </div>
            );
          })}
        </div>
      )}

      {/* Action Dialog for Selected Table (RF-34 - RF-38) */}
      {selectedTableForAction && (
        <Modal
          isOpen={!!selectedTableForAction}
          onClose={() => setSelectedTableForAction(null)}
          title={`Acciones para Mesa #${selectedTableForAction.number}`}
          subtitle={`Ubicación: ${selectedTableForAction.areaName} • Estado Actual: ${selectedTableForAction.status.toUpperCase()}`}
          size="md"
        >
          <div className="d-grid gap-3 mb-3">
            {/* If Disponible -> RF-34 Occupy Table / Create Order */}
            {selectedTableForAction.status === 'disponible' && (
              <>
                <button
                  type="button"
                  className="btn btn-success btn-lg fw-semibold d-flex align-items-center justify-content-between text-white p-3 rounded-3"
                  onClick={() => {
                    occupyTable(selectedTableForAction.id);
                    navigate('/pedidos', { state: { createForTableId: selectedTableForAction.id } });
                  }}
                >
                  <span className="text-start">
                    <span className="d-block fw-bold">Ocupar y Tomar Pedido</span>
                    <small className="opacity-75">Cambia a Ocupada e inicia toma de comandas</small>
                  </span>
                  <i className="bi bi-plus-circle-fill fs-3" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-warning text-dark fw-semibold text-start p-3 rounded-3 border-2 d-flex justify-content-between align-items-center"
                  onClick={() => {
                    setResName('');
                    setIsReserveModalOpen(true);
                  }}
                >
                  <span>
                    <span className="d-block fw-bold">Registrar Reserva Manual</span>
                    <small className="text-muted">Anota nombre de cliente y hora prevista</small>
                  </span>
                  <i className="bi bi-bookmark-plus-fill text-warning fs-4" aria-hidden="true"></i>
                </button>
              </>
            )}

            {/* If Ocupada -> Go to Order / Transfer Order (RF-38) */}
            {selectedTableForAction.status === 'ocupada' && (
              <>
                <button
                  type="button"
                  className="btn btn-primary fw-semibold text-start p-3 rounded-3 d-flex justify-content-between align-items-center w-100"
                  onClick={() => navigate('/pedidos', { state: { focusTableId: selectedTableForAction.id } })}
                >
                    <span className="flex-grow-1">
                        <span className="d-block fw-bold">
                        Ver / Editar Pedido de Mesa
                        </span>
                        <small className="opacity-75">
                        Agregar platos, enviar a cocina o gestionar
                        </small>
                    </span>
                <i className="bi bi-receipt fs-3 flex-shrink-0" aria-hidden="true"/>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary fw-semibold text-start p-3 rounded-3 d-flex justify-content-between align-items-center"
                  onClick={() => {
                    setTargetTransferTableId('');
                    setIsTransferModalOpen(true);
                  }}
                >
                  <span>
                    <span className="d-block fw-bold">Trasladar Pedido a Otra Mesa</span>
                    <small className="text-muted">Mueve la comanda a una mesa disponible</small>
                  </span>
                  <i className="bi bi-arrow-right-square-fill fs-4" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-success fw-semibold text-start p-3 rounded-3 d-flex justify-content-between align-items-center"
                  onClick={() => navigate('/ventas', { state: { billTableId: selectedTableForAction.id } })}
                >
                  <span>
                    <span className="d-block fw-bold">Generar Cuenta y Cobrar</span>
                    <small className="text-muted">Proceder a la división y cierre de venta</small>
                  </span>
                  <i className="bi bi-cash-coin fs-4" aria-hidden="true"></i>
                </button>
              </>
            )}

            {/* Common Status Controls (RF-36) */}
            <div className="p-3 rounded-3 border" style={{ background: 'var(--surface-muted)' }}>
              <label className="form-label fw-bold text-dark mb-2 d-block">Cambiar Estado Manualmente:</label>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success fw-semibold"
                  onClick={() => {
                    changeTableStatus(selectedTableForAction.id, 'disponible');
                    setSelectedTableForAction(null);
                  }}
                >
                  Disponible
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger fw-semibold"
                  onClick={() => {
                    changeTableStatus(selectedTableForAction.id, 'ocupada');
                    setSelectedTableForAction(null);
                  }}
                >
                  Ocupada
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning text-dark fw-semibold"
                  onClick={() => {
                    changeTableStatus(selectedTableForAction.id, 'reservada');
                    setSelectedTableForAction(null);
                  }}
                >
                  Reservada
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-info text-dark fw-semibold"
                  onClick={() => {
                    changeTableStatus(selectedTableForAction.id, 'limpieza');
                    setSelectedTableForAction(null);
                  }}
                >
                  En Limpieza
                </button>
              </div>
            </div>

            {/* Join Tables (RF-37) */}
            <button
              type="button"
              className="btn btn-link text-decoration-none fw-semibold text-start p-1"
              style={{ color: 'var(--color-brand)' }}
              onClick={() => {
                setTargetJoinTableId('');
                setIsJoinModalOpen(true);
              }}
            >
              <i className="bi bi-link-45deg me-1" aria-hidden="true"></i> Unir esta mesa con otra para grupos
            </button>
          </div>
        </Modal>
      )}

      {/* Reservation Modal (RF-35) */}
      <Modal
        isOpen={isReserveModalOpen}
        onClose={() => setIsReserveModalOpen(false)}
        title={`Registrar Reserva (Mesa #${selectedTableForAction?.number})`}
      >
        <form onSubmit={handleReserveSubmit}>
          <div className="row g-3 mb-4">
            <div className="col-12">
              <label htmlFor="resNameInput" className="form-label">Nombre del Cliente *</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-person-fill" aria-hidden="true"></i></span>
                <input
                  id="resNameInput"
                  type="text"
                  className="form-control"
                  placeholder="Ej. Familia Ramírez"
                  required
                  value={resName}
                  onChange={e => setResName(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12">
              <label htmlFor="resTimeInput" className="form-label">Hora Prevista *</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-clock-fill" aria-hidden="true"></i></span>
                <input
                  id="resTimeInput"
                  type="time"
                  className="form-control"
                  required
                  value={resTime}
                  onChange={e => setResTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setIsReserveModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-warning fw-semibold">
              Guardar Reserva
            </button>
          </div>
        </form>
      </Modal>

      {/* Join Tables Modal (RF-37) */}
      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title={`Unir Mesa #${selectedTableForAction?.number} con otra mesa`}
      >
        <form onSubmit={handleJoinSubmit}>
          <div className="mb-4">
            <label className="form-label d-block">Seleccionar Mesa para Agrupar *</label>
            <CustomDropdownSelect
              value={targetJoinTableId}
              onChange={setTargetJoinTableId}
              placeholder="Seleccione mesa..."
              options={tables
                .filter(t => t.id !== selectedTableForAction?.id)
                .map(t => {
                  const meta = TABLE_STATUS_META[t.status];
                  return {
                    value: t.id,
                    label: `Mesa #${t.number} / ${t.areaName} - ${t.capacity} pers. (${meta.label})`,
                    icon: meta.icon,
                    colorVariant: meta.colorVariant,
                  };
                })}
            />
          </div>
          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setIsJoinModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-brand btn fw-semibold" disabled={!targetJoinTableId}>
              Unir Mesas
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Order Modal (RF-38) */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title={`Trasladar Pedido de Mesa #${selectedTableForAction?.number}`}
      >
        <form onSubmit={handleTransferSubmit}>
          <div className="mb-4">
            <label className="form-label d-block">Mesa de Destino (Disponible) *</label>
            <CustomDropdownSelect
              value={targetTransferTableId}
              onChange={setTargetTransferTableId}
              placeholder="Seleccione mesa destino..."
              options={tables
                .filter(t => t.id !== selectedTableForAction?.id && t.status === 'disponible')
                .map(t => ({
                  value: t.id,
                  label: `Mesa #${t.number} — ${t.areaName} · ${t.capacity} pers.`,
                  icon: 'bi-check-circle-fill',
                  colorVariant: 'success' as const,
                }))}
            />
            {tables.filter(t => t.id !== selectedTableForAction?.id && t.status === 'disponible').length === 0 && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mt-2 mb-0 small" role="alert">
                <i className="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
                No hay mesas disponibles en este momento para trasladar el pedido.
              </div>
            )}
          </div>
          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setIsTransferModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-brand btn fw-semibold" disabled={!targetTransferTableId}>
              Confirmar Traslado
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
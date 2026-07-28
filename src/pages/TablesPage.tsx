import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Table, Area } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { StatCard } from '../components/common/StatCard';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const TablesPage: React.FC = () => {
  const {
    areas,
    tables,
    addArea,
    updateArea,
    deleteArea,
    addTable,
    updateTable,
    deleteTable,
    occupyTable,
    registerTableReservation,
    changeTableStatus,
    joinTables,
    transferTableOrder,
    orders,
    currentRole
  } = useApp();

  const navigate = useNavigate();
  const isAdmin = currentRole === 'Administrador';

  // Filters (RF-33)
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('todas');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');

  // View Mode: 'plano' (visual floorplan) vs 'config' (admin areas & table management)
  const [viewMode, setViewMode] = useState<'plano' | 'config'>('plano');

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

  // Config Area Modal (RF-25, RF-26)
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [areaFormData, setAreaFormData] = useState({ name: '', description: '' });
  const [deletingArea, setDeletingArea] = useState<Area | null>(null);

  // Config Table Modal (RF-29, RF-30)
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableFormData, setTableFormData] = useState({ number: 1, areaId: '', capacity: 4 });
  const [deletingTable, setDeletingTable] = useState<Table | null>(null);

  // Filtered Tables (RF-32, RF-33)
  const filteredTables = useMemo(() => {
    return tables.filter(table => {
      const matchesArea = selectedAreaFilter === 'todas' || table.areaId === selectedAreaFilter;
      const matchesStatus = selectedStatusFilter === 'todos' || table.status === selectedStatusFilter;
      return matchesArea && matchesStatus;
    });
  }, [tables, selectedAreaFilter, selectedStatusFilter]);

  // Handle Reservation submit (RF-35)
  const handleReserveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableForAction || !resName.trim()) return;
    registerTableReservation(selectedTableForAction.id, resName, resTime);
    setIsReserveModalOpen(false);
    setSelectedTableForAction(null);
  };

  // Handle Join Tables submit (RF-37)
  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableForAction || !targetJoinTableId) return;
    joinTables(selectedTableForAction.id, targetJoinTableId);
    setIsJoinModalOpen(false);
    setSelectedTableForAction(null);
  };

  // Handle Transfer Order submit (RF-38)
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableForAction || !targetTransferTableId) return;
    transferTableOrder(selectedTableForAction.id, targetTransferTableId);
    setIsTransferModalOpen(false);
    setSelectedTableForAction(null);
  };

  // Config Area Submit (RF-25, RF-26)
  const handleAreaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaFormData.name.trim()) return;
    if (editingArea) {
      updateArea(editingArea.id, areaFormData.name, areaFormData.description);
    } else {
      addArea(areaFormData.name, areaFormData.description);
    }
    setIsAreaModalOpen(false);
  };

  // Config Table Submit (RF-29, RF-30)
  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTable) {
      updateTable(editingTable.id, {
        number: Number(tableFormData.number),
        areaId: tableFormData.areaId,
        capacity: Number(tableFormData.capacity)
      });
    } else {
      addTable(Number(tableFormData.number), tableFormData.areaId, Number(tableFormData.capacity));
    }
    setIsTableModalOpen(false);
  };

  const openNewTableModal = () => {
    setEditingTable(null);
    const maxNum = Math.max(...tables.map(t => t.number), 0) + 1;
    setTableFormData({ number: maxNum, areaId: areas[0]?.id || '', capacity: 4 });
    setIsTableModalOpen(true);
  };

  const availableCount = tables.filter(t => t.status === 'disponible').length;
  const occupiedCount = tables.filter(t => t.status === 'ocupada').length;
  const reservedCount = tables.filter(t => t.status === 'reservada').length;

  return (
    <div className="container-fluid p-0">
      {/* Page Header */}
      <PageHeader
        icon="bi-diagram-3-fill"
        title="Áreas y Plano de Mesas"
        subtitle="Control interactivo de disponibilidad, plano físico de sala, reservas y traslados"
        actions={
          isAdmin && (
            <button
              className={`btn btn-sm fw-semibold ${viewMode === 'config' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
              style={{ borderRadius: 8 }}
              onClick={() => setViewMode(viewMode === 'plano' ? 'config' : 'plano')}
            >
              <i className="bi bi-gear-fill me-1"></i>
              {viewMode === 'plano' ? 'Configurar Áreas & Mesas' : 'Volver a Plano de Sala'}
            </button>
          )
        }
      />

      {viewMode === 'plano' ? (
        <>
          {/* StatCards Row */}
          <div className="row g-3 mb-4 stagger-children">
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Total Mesas"
                value={tables.length}
                subtitle={`${areas.length} áreas registradas`}
                icon="bi-table"
                colorTheme="indigo"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Disponibles"
                value={availableCount}
                subtitle="Listas para clientes"
                icon="bi-check-circle-fill"
                colorTheme="emerald"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Ocupadas"
                value={occupiedCount}
                subtitle="Con pedido en consumo"
                icon="bi-people-fill"
                colorTheme="rose"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
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
            <div className="row g-3 align-items-center justify-content-between">
              <div className="col-12 col-md-8 d-flex flex-wrap gap-1.5 align-items-center">
                <span className="fs-7 text-muted fw-semibold me-2">Área:</span>
                <button
                  className={`btn btn-sm text-nowrap fw-semibold ${selectedAreaFilter === 'todas' ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                  style={{ borderRadius: 8 }}
                  onClick={() => setSelectedAreaFilter('todas')}
                >
                  Todas ({tables.length})
                </button>
                {areas.map(area => (
                  <button
                    key={area.id}
                    className={`btn btn-sm text-nowrap fw-semibold ${selectedAreaFilter === area.id ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                    style={{ borderRadius: 8 }}
                    onClick={() => setSelectedAreaFilter(area.id)}
                  >
                    {area.name} ({tables.filter(t => t.areaId === area.id).length})
                  </button>
                ))}
              </div>

              <div className="col-12 col-md-4 d-flex justify-content-md-end gap-2 align-items-center">
                <span className="fs-7 text-muted fw-semibold me-1">Estado:</span>
                <select
                  className="form-select form-select-sm w-auto fw-semibold"
                  style={{ borderRadius: 8 }}
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value)}
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="disponible">Disponibles</option>
                  <option value="ocupada">Ocupadas</option>
                  <option value="reservada">Reservadas</option>
                  <option value="limpieza">En Limpieza</option>
                </select>
              </div>
            </div>
          </SectionCard>

          {/* Interactive Floorplan Grid (RF-32) */}
          <div className="row g-3 mb-4">
            {filteredTables.map(table => {
              const activeOrder = orders.find(o => o.id === table.currentOrderId || (o.tableId === table.id && o.status !== 'cerrado'));

              return (
                <div key={table.id} className="col-12 col-sm-6 col-md-4 col-xl-3">
                  <div
                    className={`table-card status-${table.status}`}
                    onClick={() => setSelectedTableForAction(table)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedTableForAction(table)}
                  >
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-bold fs-5" style={{ color: 'var(--text-primary)' }}>Mesa #{table.number}</span>
                        <span className="table-status-pill">{table.status}</span>
                      </div>

                      <div className="d-flex align-items-center gap-2 text-muted fs-7 mb-2">
                        <span><i className="bi bi-geo-alt me-1"></i>{table.areaName}</span>
                        <span>•</span>
                        <span><i className="bi bi-people me-1"></i>{table.capacity} pers.</span>
                      </div>

                      {table.joinedWith && table.joinedWith.length > 0 && (
                        <div className="badge border mb-2 text-truncate" style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                          <i className="bi bi-link-45deg me-1"></i>Unida con: {table.joinedWith.join(', ')}
                        </div>
                      )}

                      {table.status === 'reservada' && (
                        <div className="p-2 rounded-2 fs-7 mb-2" style={{ background: 'var(--color-amber-bg)', color: 'var(--color-amber-text)' }}>
                          <i className="bi bi-bookmark-star-fill text-warning me-1"></i>
                          <strong>{table.reservationName}</strong> ({table.reservationTime})
                        </div>
                      )}

                      {table.status === 'ocupada' && activeOrder && (
                        <div className="p-2 rounded-2 border fs-7 mb-2" style={{ background: 'var(--surface-muted)' }}>
                          <div className="d-flex justify-content-between fw-bold" style={{ color: 'var(--text-primary)' }}>
                            <span>Pedido #{activeOrder.id.slice(-4)}</span>
                            <span style={{ color: 'var(--color-brand)' }}>{activeOrder.items.length} platos</span>
                          </div>
                          <small style={{ color: 'var(--text-muted)' }}>{activeOrder.waiterName}</small>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-top mt-2 d-flex justify-content-between align-items-center">
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Clic para opciones</small>
                      <i className="bi bi-three-dots-vertical text-muted"></i>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Configuration View: Admin Area & Table Management (RF-25 - RF-31) */
        <div className="row g-4 mb-4">
          {/* Left Column: Areas Management (RF-25, RF-26, RF-27, RF-28) */}
          <div className="col-12 col-lg-5">
            <SectionCard
              icon="bi-geo-alt-fill"
              title="Áreas Configuradas"
              actions={
                <button
                  className="btn-brand btn btn-sm fw-semibold"
                  style={{ borderRadius: 8 }}
                  onClick={() => { setEditingArea(null); setAreaFormData({ name: '', description: '' }); setIsAreaModalOpen(true); }}
                >
                  <i className="bi bi-plus-lg me-1"></i> Nueva Área
                </button>
              }
            >
              <div className="d-flex flex-column gap-2">
                {areas.map(area => (
                  <div key={area.id} className="p-3 rounded-3 border bg-white d-flex align-items-center justify-content-between shadow-sm">
                    <div>
                      <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{area.name}</div>
                      <small style={{ color: 'var(--text-muted)' }}>{area.description || 'Sin descripción'}</small>
                      <small className="d-block fw-semibold mt-1" style={{ color: 'var(--color-brand)' }}>
                        {tables.filter(t => t.areaId === area.id).length} mesas asignadas
                      </small>
                    </div>
                    <div className="d-flex gap-1">
                      <button
                        className="btn-icon btn-icon-primary"
                        onClick={() => { setEditingArea(area); setAreaFormData({ name: area.name, description: area.description }); setIsAreaModalOpen(true); }}
                      >
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                      <button
                        className="btn-icon btn-icon-danger"
                        onClick={() => setDeletingArea(area)}
                      >
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Right Column: Tables Config Table (RF-29, RF-30, RF-31) */}
          <div className="col-12 col-lg-7">
            <SectionCard
              icon="bi-table"
              title="Listado de Mesas Registradas"
              noPadding
              actions={
                <button className="btn-brand btn btn-sm fw-semibold" style={{ borderRadius: 8 }} onClick={openNewTableModal}>
                  <i className="bi bi-plus-lg me-1"></i> Nueva Mesa
                </button>
              }
            >
              <div className="table-responsive-x">
                <div className="custom-table-container">
                  <table className="custom-table" style={{ minWidth: 500 }}>
                    <thead>
                      <tr>
                        <th>Número</th>
                        <th>Área Asignada</th>
                        <th>Capacidad</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tables.map(table => (
                        <tr key={table.id}>
                          <td><span className="fw-bold" style={{ color: 'var(--text-primary)' }}>Mesa #{table.number}</span></td>
                          <td><span className="badge" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>{table.areaName}</span></td>
                          <td><span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{table.capacity} personas</span></td>
                          <td className="text-end">
                            <div className="d-inline-flex gap-1">
                              <button
                                className="btn-icon btn-icon-primary"
                                onClick={() => {
                                  setEditingTable(table);
                                  setTableFormData({ number: table.number, areaId: table.areaId, capacity: table.capacity });
                                  setIsTableModalOpen(true);
                                }}
                              >
                                <i className="bi bi-pencil-fill"></i>
                              </button>
                              <button
                                className="btn-icon btn-icon-danger"
                                onClick={() => setDeletingTable(table)}
                              >
                                <i className="bi bi-trash-fill"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </SectionCard>
          </div>
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
          <div className="d-flex flex-column gap-2 mb-3">
            {/* If Disponible -> RF-34 Occupy Table / Create Order */}
            {selectedTableForAction.status === 'disponible' && (
              <>
                <button
                  className="btn btn-lg fw-semibold d-flex align-items-center justify-content-between text-white p-3 rounded-3"
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)', border: 'none' }}
                  onClick={() => {
                    occupyTable(selectedTableForAction.id);
                    navigate('/pedidos', { state: { createForTableId: selectedTableForAction.id } });
                  }}
                >
                  <div>
                    <div className="fw-bold">Ocupar y Tomar Pedido</div>
                    <small className="opacity-75">Cambia a Ocupada e inicia toma de comandas</small>
                  </div>
                  <i className="bi bi-plus-circle-fill fs-3"></i>
                </button>

                <button
                  className="btn btn-outline-warning text-dark fw-semibold text-start p-3 rounded-3 border-2 d-flex justify-content-between align-items-center"
                  onClick={() => {
                    setResName('');
                    setIsReserveModalOpen(true);
                  }}
                >
                  <div>
                    <div className="fw-bold">Registrar Reserva Manual</div>
                    <small style={{ color: 'var(--text-muted)' }}>Anota nombre de cliente y hora prevista</small>
                  </div>
                  <i className="bi bi-bookmark-plus-fill text-warning fs-4"></i>
                </button>
              </>
            )}

            {/* If Ocupada -> Go to Order / Transfer Order (RF-38) */}
            {selectedTableForAction.status === 'ocupada' && (
              <>
                <button
                  className="btn-brand btn btn-lg fw-semibold text-start p-3 rounded-3 d-flex justify-content-between align-items-center"
                  onClick={() => navigate('/pedidos', { state: { focusTableId: selectedTableForAction.id } })}
                >
                  <div>
                    <div className="fw-bold">Ver / Editar Pedido de Mesa</div>
                    <small className="opacity-75">Agregar platos, enviar a cocina o gestionar</small>
                  </div>
                  <i className="bi bi-receipt fs-3"></i>
                </button>

                <button
                  className="btn btn-outline-primary fw-semibold text-start p-3 rounded-3 d-flex justify-content-between align-items-center"
                  onClick={() => {
                    setTargetTransferTableId('');
                    setIsTransferModalOpen(true);
                  }}
                >
                  <div>
                    <div className="fw-bold">Trasladar Pedido a Otra Mesa</div>
                    <small style={{ color: 'var(--text-muted)' }}>Mueve la comanda a una mesa disponible</small>
                  </div>
                  <i className="bi bi-arrow-right-square-fill fs-4"></i>
                </button>

                <button
                  className="btn btn-outline-success fw-semibold text-start p-3 rounded-3 d-flex justify-content-between align-items-center"
                  onClick={() => navigate('/ventas', { state: { billTableId: selectedTableForAction.id } })}
                >
                  <div>
                    <div className="fw-bold">Generar Cuenta y Cobrar</div>
                    <small style={{ color: 'var(--text-muted)' }}>Proceder a la división y cierre de venta</small>
                  </div>
                  <i className="bi bi-cash-coin fs-4"></i>
                </button>
              </>
            )}

            {/* Common Status Controls (RF-36) */}
            <div className="p-3 rounded-3 border mt-2" style={{ background: 'var(--surface-muted)' }}>
              <label className="form-label fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>Cambiar Estado Manualmente:</label>
              <div className="d-flex flex-wrap gap-2">
                <button
                  className="btn btn-sm btn-outline-success fw-semibold"
                  style={{ borderRadius: 6 }}
                  onClick={() => { changeTableStatus(selectedTableForAction.id, 'disponible'); setSelectedTableForAction(null); }}
                >
                  Disponible
                </button>
                <button
                  className="btn btn-sm btn-outline-danger fw-semibold"
                  style={{ borderRadius: 6 }}
                  onClick={() => { changeTableStatus(selectedTableForAction.id, 'ocupada'); setSelectedTableForAction(null); }}
                >
                  Ocupada
                </button>
                <button
                  className="btn btn-sm btn-outline-warning fw-semibold text-dark"
                  style={{ borderRadius: 6 }}
                  onClick={() => { changeTableStatus(selectedTableForAction.id, 'reservada'); setSelectedTableForAction(null); }}
                >
                  Reservada
                </button>
                <button
                  className="btn btn-sm btn-outline-info fw-semibold text-dark"
                  style={{ borderRadius: 6 }}
                  onClick={() => { changeTableStatus(selectedTableForAction.id, 'limpieza'); setSelectedTableForAction(null); }}
                >
                  En Limpieza
                </button>
              </div>
            </div>

            {/* Join Tables (RF-37) */}
            <button
              className="btn btn-link text-decoration-none fw-semibold text-start p-1 mt-1"
              style={{ color: 'var(--color-brand)' }}
              onClick={() => { setTargetJoinTableId(''); setIsJoinModalOpen(true); }}
            >
              <i className="bi bi-link-45deg me-1"></i> Unir esta mesa con otra para grupos
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
          <div className="mb-3">
            <label className="form-label">Nombre del Cliente *</label>
            <input
              type="text"
              className="form-control"
              style={{ borderRadius: 8 }}
              placeholder="Ej. Familia Ramírez"
              required
              value={resName}
              onChange={e => setResName(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Hora Prevista *</label>
            <input
              type="time"
              className="form-control"
              style={{ borderRadius: 8 }}
              required
              value={resTime}
              onChange={e => setResTime(e.target.value)}
            />
          </div>
          <div className="d-flex justify-content-end gap-2 border-top pt-2">
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setIsReserveModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-warning fw-semibold" style={{ borderRadius: 8 }}>Guardar Reserva</button>
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
            <label className="form-label">Seleccionar Mesa para Agrupar *</label>
            <select
              className="form-select"
              style={{ borderRadius: 8 }}
              required
              value={targetJoinTableId}
              onChange={e => setTargetJoinTableId(e.target.value)}
            >
              <option value="">Seleccione mesa...</option>
              {tables
                .filter(t => t.id !== selectedTableForAction?.id)
                .map(t => (
                  <option key={t.id} value={t.id}>
                    Mesa #{t.number} ({t.areaName} - Capacidad: {t.capacity})
                  </option>
                ))}
            </select>
          </div>
          <div className="d-flex justify-content-end gap-2 border-top pt-2">
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setIsJoinModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }}>Unir Mesas</button>
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
            <label className="form-label">Mesa de Destino (Disponible) *</label>
            <select
              className="form-select"
              style={{ borderRadius: 8 }}
              required
              value={targetTransferTableId}
              onChange={e => setTargetTransferTableId(e.target.value)}
            >
              <option value="">Seleccione mesa destino...</option>
              {tables
                .filter(t => t.id !== selectedTableForAction?.id && t.status === 'disponible')
                .map(t => (
                  <option key={t.id} value={t.id}>
                    Mesa #{t.number} ({t.areaName} - Capacidad: {t.capacity})
                  </option>
                ))}
            </select>
          </div>
          <div className="d-flex justify-content-end gap-2 border-top pt-2">
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setIsTransferModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }}>Confirmar Traslado</button>
          </div>
        </form>
      </Modal>

      {/* Admin Area Modal (RF-25, RF-26) */}
      <Modal
        isOpen={isAreaModalOpen}
        onClose={() => setIsAreaModalOpen(false)}
        title={editingArea ? 'Editar Área' : 'Crear Área'}
      >
        <form onSubmit={handleAreaSubmit}>
          <div className="mb-3">
            <label className="form-label">Nombre del Área *</label>
            <input
              type="text"
              className="form-control"
              style={{ borderRadius: 8 }}
              placeholder="Ej. Terraza VIP"
              required
              value={areaFormData.name}
              onChange={e => setAreaFormData({ ...areaFormData, name: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Descripción</label>
            <input
              type="text"
              className="form-control"
              style={{ borderRadius: 8 }}
              placeholder="Ej. Zona exterior con estufas..."
              value={areaFormData.description}
              onChange={e => setAreaFormData({ ...areaFormData, description: e.target.value })}
            />
          </div>
          <div className="d-flex justify-content-end gap-2 border-top pt-2">
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setIsAreaModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }}>Guardar Área</button>
          </div>
        </form>
      </Modal>

      {/* Delete Area Confirm (RF-27) */}
      {deletingArea && (
        <ConfirmModal
          isOpen={!!deletingArea}
          onClose={() => setDeletingArea(null)}
          onConfirm={() => deleteArea(deletingArea.id)}
          title="Eliminar Área"
          message={`¿Desea eliminar el área "${deletingArea.name}"? Solo es posible eliminar áreas sin mesas asignadas.`}
          variant="danger"
        />
      )}

      {/* Admin Table Modal (RF-29, RF-30) */}
      <Modal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        title={editingTable ? 'Editar Mesa' : 'Crear Nueva Mesa'}
      >
        <form onSubmit={handleTableSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label">Número de Mesa *</label>
              <input
                type="number"
                min="1"
                className="form-control"
                style={{ borderRadius: 8 }}
                required
                value={tableFormData.number}
                onChange={e => setTableFormData({ ...tableFormData, number: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="col-6">
              <label className="form-label">Capacidad (Personas) *</label>
              <input
                type="number"
                min="1"
                className="form-control"
                style={{ borderRadius: 8 }}
                required
                value={tableFormData.capacity}
                onChange={e => setTableFormData({ ...tableFormData, capacity: parseInt(e.target.value) || 2 })}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label">Área Asignada *</label>
            <select
              className="form-select"
              style={{ borderRadius: 8 }}
              required
              value={tableFormData.areaId}
              onChange={e => setTableFormData({ ...tableFormData, areaId: e.target.value })}
            >
              <option value="" disabled>Seleccione área...</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="d-flex justify-content-end gap-2 border-top pt-2">
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={() => setIsTableModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-brand btn fw-semibold" style={{ borderRadius: 8 }}>Guardar Mesa</button>
          </div>
        </form>
      </Modal>

      {/* Delete Table Confirm (RF-31) */}
      {deletingTable && (
        <ConfirmModal
          isOpen={!!deletingTable}
          onClose={() => setDeletingTable(null)}
          onConfirm={() => deleteTable(deletingTable.id)}
          title="Eliminar Mesa"
          message={`¿Desea eliminar la Mesa #${deletingTable.number}?`}
          variant="danger"
        />
      )}
    </div>
  );
};

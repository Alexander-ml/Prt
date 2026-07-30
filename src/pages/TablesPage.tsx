import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Table, Area } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { SectionCard } from '../components/common/SectionCard';
import { StatCard } from '../components/common/StatCard';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { CustomDropdownSelect } from '../components/common/CustomDropdownSelect';

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
  
  const statusColorMap: Record<
    string,
    { label: string; icon: string; colorVariant: 'success' | 'warning' | 'danger' | 'info'; badge: string; border: string }
  > = {
    disponible: {
      label: 'Disponible',
      icon: 'bi-check-circle-fill',
      colorVariant: 'success',
      badge: 'bg-success-subtle text-success-emphasis',
      border: 'border-success',
    },
    ocupada: {
      label: 'Ocupada',
      icon: 'bi-people-fill',
      colorVariant: 'danger',
      badge: 'bg-danger-subtle text-danger-emphasis',
      border: 'border-danger',
    },
    reservada: {
      label: 'Reservada',
      icon: 'bi-bookmark-star-fill',
      colorVariant: 'warning',
      badge: 'bg-warning-subtle text-warning-emphasis',
      border: 'border-warning',
    },
    limpieza: {
      label: 'En Limpieza',
      icon: 'bi-droplet-fill',
      colorVariant: 'info',
      badge: 'bg-info-subtle text-info-emphasis',
      border: 'border-info',
    },
  };

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
              type="button"
              className={`btn btn-sm fw-semibold rounded-3 ${
                viewMode === 'config' ? 'btn-primary' : 'btn-outline-secondary'
              }`}
              onClick={() => setViewMode(viewMode === 'plano' ? 'config' : 'plano')}
            >
              <i className="bi bi-gear-fill me-1" aria-hidden="true"></i>
              {viewMode === 'plano' ? 'Configurar Áreas & Mesas' : 'Volver a Plano de Sala'}
            </button>
          )
        }
      />

      {viewMode === 'plano' ? (
        <>
          {/* StatCards Row */}
          <div className="row g-3 mb-4 stagger-children">
            <div className="col-6 col-xl-3">
              <StatCard
                title="Total Mesas"
                value={tables.length}
                subtitle={`${areas.length} áreas registradas`}
                icon="bi-table"
                colorTheme="indigo"
              />
            </div>
            <div className="col-6 col-xl-3">
              <StatCard
                title="Disponibles"
                value={availableCount}
                subtitle="Listas para clientes"
                icon="bi-check-circle-fill"
                colorTheme="emerald"
              />
            </div>
            <div className="col-6 col-xl-3">
              <StatCard
                title="Ocupadas"
                value={occupiedCount}
                subtitle="Con pedido en consumo"
                icon="bi-people-fill"
                colorTheme="rose"
              />
            </div>
            <div className="col-6 col-xl-3">
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
              <div className="col-12 col-md-8 d-flex flex-wrap gap-2 align-items-center">
                <span className="small text-muted fw-semibold me-1">Área:</span>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill fw-semibold ${
                    selectedAreaFilter === 'todas' ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setSelectedAreaFilter('todas')}
                >
                  Todas ({tables.length})
                </button>
                {areas.map(area => (
                  <button
                    key={area.id}
                    type="button"
                    className={`btn btn-sm rounded-pill fw-semibold text-nowrap ${
                      selectedAreaFilter === area.id ? 'btn-primary' : 'btn-outline-secondary'
                    }`}
                    onClick={() => setSelectedAreaFilter(area.id)}
                  >
                    {area.name} ({tables.filter(t => t.areaId === area.id).length})
                  </button>
                ))}
              </div>
              <div className="col-12 col-md-4">
                <div className="d-flex justify-content-md-end align-items-center gap-2">
                  <span id="statusFilterLabel" className="small text-muted fw-semibold text-nowrap">
                    Estado:
                  </span>
                  <div style={{ minWidth: 200 }}>
                    {/* Select de estado: colores semánticos por disponibilidad */}
                    <CustomDropdownSelect
                      value={selectedStatusFilter}
                      onChange={setSelectedStatusFilter}
                      size="sm"
                      options={[
                        { value: 'todos', label: 'Todos los Estados', icon: 'bi-grid-fill', colorVariant: 'secondary' },
                        ...Object.entries(statusColorMap).map(([status, cfg]) => ({
                          value: status,
                          label: cfg.label + 's',
                          icon: cfg.icon,
                          colorVariant: cfg.colorVariant,
                        })),
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Interactive Floorplan Grid (RF-32) */}
          <div className="row g-3 mb-4">
            {filteredTables.map(table => {
              const activeOrder = orders.find(
                o => o.id === table.currentOrderId || (o.tableId === table.id && o.status !== 'cerrado')
              );
              const cfg = statusColorMap[table.status] ?? statusColorMap.disponible;
              return (
                <div key={table.id} className="col-6 col-md-4 col-xl-3">
                  <div
                    className={`table-card card h-100 shadow-sm rounded-4 border-start border-4 ${cfg.border}`}
                    onClick={() => setSelectedTableForAction(table)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedTableForAction(table)}
                  >
                    <div className="card-body d-flex flex-column p-3">
                      <div className="d-flex align-items-center justify-content-between mb-2 gap-2">
                        <span className="fw-bold fs-4 text-dark">Mesa #{table.number}</span>
                        <span className={`badge rounded-pill text-nowrap ${cfg.badge}`}>
                          <i className={`bi ${cfg.icon} me-1`} aria-hidden="true"></i>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                        <span className="text-truncate">
                          <i className="bi bi-geo-alt me-1" aria-hidden="true"></i>
                          {table.areaName}
                        </span>
                        <span>•</span>
                        <span className="text-nowrap">
                          <i className="bi bi-people me-1" aria-hidden="true"></i>
                          {table.capacity} pers.
                        </span>
                      </div>
                      {table.joinedWith && table.joinedWith.length > 0 && (
                        <div className="badge bg-primary-subtle text-primary-emphasis mb-2 text-truncate">
                          <i className="bi bi-link-45deg me-1" aria-hidden="true"></i>
                          Unida con: {table.joinedWith.join(', ')}
                        </div>
                      )}
                      {table.status === 'reservada' && (
                        <div className="p-2 rounded-3 bg-warning-subtle text-warning-emphasis small mb-2">
                          <i className="bi bi-bookmark-star-fill me-1" aria-hidden="true"></i>
                          <strong>{table.reservationName}</strong> ({table.reservationTime})
                        </div>
                      )}
                      {table.status === 'ocupada' && activeOrder && (
                        <div className="p-2 rounded-3 border bg-light small mb-2">
                          <div className="d-flex justify-content-between fw-bold text-dark">
                            <span>Pedido #{activeOrder.id.slice(-4)}</span>
                            <span className="text-primary">{activeOrder.items.length} platos</span>
                          </div>
                          <small className="text-muted">{activeOrder.waiterName}</small>
                        </div>
                      )}
                      <div className="pt-2 border-top mt-auto d-flex justify-content-between align-items-center">
                        <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                          Clic para opciones
                        </small>
                        <i className="bi bi-three-dots-vertical text-muted" aria-hidden="true"></i>
                      </div>
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
                  type="button"
                  className="btn-brand btn btn-sm fw-semibold rounded-3"
                  onClick={() => {
                    setEditingArea(null);
                    setAreaFormData({ name: '', description: '' });
                    setIsAreaModalOpen(true);
                  }}
                >
                  <i className="bi bi-plus-lg me-1" aria-hidden="true"></i> Nueva Área
                </button>
              }
            >
              <div className="d-flex flex-column gap-2">
                {areas.map(area => (
                  <div
                    key={area.id}
                    className="p-3 rounded-3 border bg-white d-flex align-items-center justify-content-between shadow-sm"
                  >
                    <div className="text-truncate me-2">
                      <div className="fw-bold text-dark">{area.name}</div>
                      <small className="text-muted">{area.description || 'Sin descripción'}</small>
                      <small className="d-block fw-semibold mt-1 text-primary">
                        {tables.filter(t => t.areaId === area.id).length} mesas asignadas
                      </small>
                    </div>
                    <div className="d-flex gap-1 flex-shrink-0">
                      <button
                        type="button"
                        className="btn-icon btn-icon-primary"
                        aria-label={`Editar área ${area.name}`}
                        onClick={() => {
                          setEditingArea(area);
                          setAreaFormData({ name: area.name, description: area.description });
                          setIsAreaModalOpen(true);
                        }}
                      >
                        <i className="bi bi-pencil-fill" aria-hidden="true"></i>
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-icon-danger"
                        aria-label={`Eliminar área ${area.name}`}
                        onClick={() => setDeletingArea(area)}
                      >
                        <i className="bi bi-trash-fill" aria-hidden="true"></i>
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
                <button type="button" className="btn-brand btn btn-sm fw-semibold rounded-3" onClick={openNewTableModal}>
                  <i className="bi bi-plus-lg me-1" aria-hidden="true"></i> Nueva Mesa
                </button>
              }
            >
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
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
                        <td>
                          <span className="fw-bold text-dark">Mesa #{table.number}</span>
                        </td>
                        <td>
                          <span className="badge bg-secondary-subtle text-secondary-emphasis border">
                            {table.areaName}
                          </span>
                        </td>
                        <td>
                          <span className="fw-semibold text-dark">{table.capacity} personas</span>
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            <button
                              type="button"
                              className="btn-icon btn-icon-primary"
                              aria-label={`Editar mesa ${table.number}`}
                              onClick={() => {
                                setEditingTable(table);
                                setTableFormData({ number: table.number, areaId: table.areaId, capacity: table.capacity });
                                setIsTableModalOpen(true);
                              }}
                            >
                              <i className="bi bi-pencil-fill" aria-hidden="true"></i>
                            </button>
                            <button
                              type="button"
                              className="btn-icon btn-icon-danger"
                              aria-label={`Eliminar mesa ${table.number}`}
                              onClick={() => setDeletingTable(table)}
                            >
                              <i className="bi bi-trash-fill" aria-hidden="true"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  type="button"
                  className="btn btn-success btn-lg fw-semibold d-flex align-items-center justify-content-between text-white p-3 rounded-4"
                  onClick={() => {
                    occupyTable(selectedTableForAction.id);
                    navigate('/pedidos', { state: { createForTableId: selectedTableForAction.id } });
                  }}
                >
                  <div className="text-start">
                    <div className="fw-bold">Ocupar y Tomar Pedido</div>
                    <small className="opacity-75">Cambia a Ocupada e inicia toma de comandas</small>
                  </div>
                  <i className="bi bi-plus-circle-fill fs-3" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-warning text-dark fw-semibold text-start p-3 rounded-4 border-2 d-flex justify-content-between align-items-center"
                  onClick={() => {
                    setResName('');
                    setIsReserveModalOpen(true);
                  }}
                >
                  <div>
                    <div className="fw-bold">Registrar Reserva Manual</div>
                    <small className="text-muted">Anota nombre de cliente y hora prevista</small>
                  </div>
                  <i className="bi bi-bookmark-plus-fill text-warning fs-4" aria-hidden="true"></i>
                </button>
              </>
            )}

            {/* If Ocupada -> Go to Order / Transfer Order (RF-38) */}
            {selectedTableForAction.status === 'ocupada' && (
              <>
                <button
                  type="button"
                  className="btn-brand btn btn-lg fw-semibold text-start p-3 rounded-4 d-flex justify-content-between align-items-center"
                  onClick={() => navigate('/pedidos', { state: { focusTableId: selectedTableForAction.id } })}
                >
                  <div>
                    <div className="fw-bold">Ver / Editar Pedido de Mesa</div>
                    <small className="opacity-75">Agregar platos, enviar a cocina o gestionar</small>
                  </div>
                  <i className="bi bi-receipt fs-3" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary fw-semibold text-start p-3 rounded-4 d-flex justify-content-between align-items-center"
                  onClick={() => {
                    setTargetTransferTableId('');
                    setIsTransferModalOpen(true);
                  }}
                >
                  <div>
                    <div className="fw-bold">Trasladar Pedido a Otra Mesa</div>
                    <small className="text-muted">Mueve la comanda a una mesa disponible</small>
                  </div>
                  <i className="bi bi-arrow-right-square-fill fs-4" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-success fw-semibold text-start p-3 rounded-4 d-flex justify-content-between align-items-center"
                  onClick={() => navigate('/ventas', { state: { billTableId: selectedTableForAction.id } })}
                >
                  <div>
                    <div className="fw-bold">Generar Cuenta y Cobrar</div>
                    <small className="text-muted">Proceder a la división y cierre de venta</small>
                  </div>
                  <i className="bi bi-cash-coin fs-4" aria-hidden="true"></i>
                </button>
              </>
            )}

            {/* Common Status Controls (RF-36) */}
            <div className="p-3 rounded-3 border bg-light mt-2">
              <label className="form-label fw-bold text-dark mb-2">Cambiar Estado Manualmente:</label>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success fw-semibold rounded-2"
                  onClick={() => {
                    changeTableStatus(selectedTableForAction.id, 'disponible');
                    setSelectedTableForAction(null);
                  }}
                >
                  Disponible
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger fw-semibold rounded-2"
                  onClick={() => {
                    changeTableStatus(selectedTableForAction.id, 'ocupada');
                    setSelectedTableForAction(null);
                  }}
                >
                  Ocupada
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning fw-semibold text-dark rounded-2"
                  onClick={() => {
                    changeTableStatus(selectedTableForAction.id, 'reservada');
                    setSelectedTableForAction(null);
                  }}
                >
                  Reservada
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-info fw-semibold text-dark rounded-2"
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
              className="btn btn-link text-decoration-none fw-semibold text-start p-1 mt-1 text-primary"
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
          <div className="mb-3">
            <label htmlFor="resNameInput" className="form-label">Nombre del Cliente *</label>
            <input
              id="resNameInput"
              type="text"
              className="form-control rounded-3"
              placeholder="Ej. Familia Ramírez"
              required
              value={resName}
              onChange={e => setResName(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="resTimeInput" className="form-label">Hora Prevista *</label>
            <input
              id="resTimeInput"
              type="time"
              className="form-control rounded-3"
              required
              value={resTime}
              onChange={e => setResTime(e.target.value)}
            />
          </div>
          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => setIsReserveModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-warning fw-semibold rounded-3">
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
            {/* Select de estado: colores por disponibilidad, para elegir con qué mesa unir */}
            <CustomDropdownSelect
              value={targetJoinTableId}
              onChange={setTargetJoinTableId}
              placeholder="Seleccione mesa..."
              options={tables
                .filter(t => t.id !== selectedTableForAction?.id)
                .map(t => {
                  const cfg = statusColorMap[t.status] ?? statusColorMap.disponible;
                  return {
                    value: t.id,
                    label: `Mesa #${t.number} / ${t.areaName} - ${t.capacity} pers. (${cfg.label})`,
                    icon: cfg.icon,
                    colorVariant: cfg.colorVariant,
                  };
                })}
            />
          </div>
          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => setIsJoinModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-brand btn fw-semibold rounded-3" disabled={!targetJoinTableId}>
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
            {/* Todas las opciones ya están filtradas a 'disponible': refuerzo visual en verde */}
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
              <div className="form-text text-danger mt-1">
                No hay mesas disponibles en este momento para trasladar el pedido.
              </div>
            )}
          </div>
          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => setIsTransferModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-brand btn fw-semibold rounded-3" disabled={!targetTransferTableId}>
              Confirmar Traslado
            </button>
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
            <label htmlFor="areaNameInput" className="form-label">Nombre del Área *</label>
            <input
              id="areaNameInput"
              type="text"
              className="form-control rounded-3"
              placeholder="Ej. Terraza VIP"
              required
              value={areaFormData.name}
              onChange={e => setAreaFormData({ ...areaFormData, name: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="areaDescInput" className="form-label">Descripción</label>
            <input
              id="areaDescInput"
              type="text"
              className="form-control rounded-3"
              placeholder="Ej. Zona exterior con estufas..."
              value={areaFormData.description}
              onChange={e => setAreaFormData({ ...areaFormData, description: e.target.value })}
            />
          </div>
          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => setIsAreaModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-brand btn fw-semibold rounded-3">
              Guardar Área
            </button>
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
              <label htmlFor="tableNumberInput" className="form-label">Número de Mesa *</label>
              <input
                id="tableNumberInput"
                type="number"
                min="1"
                className="form-control rounded-3"
                required
                value={tableFormData.number}
                onChange={e => setTableFormData({ ...tableFormData, number: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="col-6">
              <label htmlFor="tableCapacityInput" className="form-label">Capacidad (Personas) *</label>
              <input
                id="tableCapacityInput"
                type="number"
                min="1"
                className="form-control rounded-3"
                required
                value={tableFormData.capacity}
                onChange={e => setTableFormData({ ...tableFormData, capacity: parseInt(e.target.value) || 2 })}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label d-block">Área Asignada *</label>
            {/* Select de categorización: colores neutros, sin semántica de alerta */}
            <CustomDropdownSelect
              value={tableFormData.areaId}
              onChange={value => setTableFormData({ ...tableFormData, areaId: value })}
              placeholder="Seleccione área..."
              options={areas.map(a => ({
                value: a.id,
                label: a.name,
                icon: 'bi-geo-alt-fill',
                colorVariant: 'primary' as const,
              }))}
            />
          </div>
          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary rounded-3" onClick={() => setIsTableModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-brand btn fw-semibold rounded-3" disabled={!tableFormData.areaId}>
              Guardar Mesa
            </button>
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

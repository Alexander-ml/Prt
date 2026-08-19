import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Table, Area } from '../../types';
import { SectionCard } from '../common/SectionCard';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { CustomDropdownSelect } from '../common/CustomDropdownSelect';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import { MobileAreaList, MobileTableList } from './TablesConfigMobileLists';
import { TABLE_STATUS_META } from './tableStatusMeta';

/**
 * TablesConfigView — Configuración administrativa de Áreas y Mesas
 * (RF-25 a RF-31). Usuario: Administrador, fuera del horario de servicio.
 * Objetivo: mantener el catálogo físico de mesas correcto, no operar sala.
 */
export const TablesConfigView: React.FC = () => {
  const { areas, tables, addArea, updateArea, deleteArea, addTable, updateTable, deleteTable } = useApp();

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

  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTable) {
      updateTable(editingTable.id, {
        number: Number(tableFormData.number),
        areaId: tableFormData.areaId,
        capacity: Number(tableFormData.capacity),
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

  const openNewAreaModal = () => {
    setEditingArea(null);
    setAreaFormData({ name: '', description: '' });
    setIsAreaModalOpen(true);
  };

  const openEditAreaModal = (area: Area) => {
    setEditingArea(area);
    setAreaFormData({ name: area.name, description: area.description });
    setIsAreaModalOpen(true);
  };

  const openEditTableModal = (table: Table) => {
    setEditingTable(table);
    setTableFormData({ number: table.number, areaId: table.areaId, capacity: table.capacity });
    setIsTableModalOpen(true);
  };

  return (
    <div className="row g-4 mb-4">
      {/* Left Column: Areas Management (RF-25, RF-26, RF-27, RF-28) */}
      <div className="col-12 col-lg-5">
        <SectionCard
          icon="bi-geo-alt-fill"
          title="Áreas Configuradas"
          className="table-config-section-card"
          noPadding
          actions={
            <button
              type="button"
              className="btn-brand btn btn-sm fw-semibold"
              onClick={openNewAreaModal}
            >
              <i className="bi bi-plus-lg me-1" aria-hidden="true"></i> Nueva Área
            </button>
          }
        >
          <div className="d-sm-none">
            <MobileAreaList
              areas={areas}
              tables={tables}
              onEdit={openEditAreaModal}
              onDelete={setDeletingArea}
            />
          </div>
          <div className="d-none d-sm-block table-responsive-x">
            <div className="custom-table-container">
              <table className="custom-table" style={{ minWidth: 420 }}>
                <thead>
                  <tr>
                    <th>Área</th>
                    <th>Mesas</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.length === 0 ? (
                    <tr>
                      <td colSpan={3}>
                        <EmptyState icon="bi-geo-alt" title="Aún no hay áreas configuradas" />
                      </td>
                    </tr>
                  ) : (
                    areas.map(area => {
                      const assignedCount = tables.filter(t => t.areaId === area.id).length;
                      return (
                        <tr key={area.id}>
                          <td>
                            <div className="fw-bold text-truncate" style={{ color: 'var(--text-primary)', maxWidth: 180 }}>
                              {area.name}
                            </div>
                            <div className="text-truncate small" style={{ color: 'var(--text-muted)', maxWidth: 180 }}>
                              {area.description || 'Sin descripción'}
                            </div>
                          </td>
                          <td>
                            <Badge status={`${assignedCount} mesas`} variant="primary" />
                          </td>
                          <td className="text-end">
                            <div className="d-inline-flex gap-1">
                              <button
                                type="button"
                                className="btn-icon btn-icon-primary"
                                aria-label={`Editar área ${area.name}`}
                                onClick={() => openEditAreaModal(area)}
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
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Right Column: Tables Config Table (RF-29, RF-30, RF-31) */}
      <div className="col-12 col-lg-7">
        <SectionCard
          icon="bi-table"
          title="Listado de Mesas Registradas"
          className="table-config-section-card"
          noPadding
          actions={
            <button type="button" className="btn-brand btn btn-sm fw-semibold" onClick={openNewTableModal}>
              <i className="bi bi-plus-lg me-1" aria-hidden="true"></i> Nueva Mesa
            </button>
          }
        >
          <div className="d-sm-none">
            <MobileTableList
              tables={tables}
              onEdit={openEditTableModal}
              onDelete={setDeletingTable}
            />
          </div>
          <div className="d-none d-sm-block table-responsive-x">
            <div className="custom-table-container">
              <table className="custom-table" style={{ minWidth: 620 }}>
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Área Asignada</th>
                    <th>Capacidad</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <EmptyState icon="bi-table" title="Aún no hay mesas registradas" />
                      </td>
                    </tr>
                  ) : (
                    tables.map(table => {
                      const meta = TABLE_STATUS_META[table.status];
                      return (
                        <tr key={table.id}>
                          <td>
                            <span className="fw-bold" style={{ color: 'var(--text-primary)' }}>Mesa #{table.number}</span>
                          </td>
                          <td>
                            <Badge status={table.areaName} variant="secondary" />
                          </td>
                          <td>
                            <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{table.capacity}</span>{' '}
                            <span style={{ color: 'var(--text-muted)' }}>personas</span>
                          </td>
                          <td>
                            <Badge status={meta.label} variant={meta.colorVariant} icon={meta.icon} />
                          </td>
                          <td className="text-end">
                            <div className="d-inline-flex gap-1">
                              <button
                                type="button"
                                className="btn-icon btn-icon-primary"
                                aria-label={`Editar mesa ${table.number}`}
                                onClick={() => openEditTableModal(table)}
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Admin Area Modal (RF-25, RF-26) */}
      <Modal
        isOpen={isAreaModalOpen}
        onClose={() => setIsAreaModalOpen(false)}
        title={editingArea ? 'Editar Área' : 'Crear Área'}
      >
        <form onSubmit={handleAreaSubmit}>
          <div className="mb-3">
            <label htmlFor="areaNameInput" className="form-label">Nombre del Área *</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-geo-alt-fill" aria-hidden="true"></i></span>
              <input
                id="areaNameInput"
                type="text"
                className="form-control"
                placeholder="Ej. Terraza VIP"
                required
                value={areaFormData.name}
                onChange={e => setAreaFormData({ ...areaFormData, name: e.target.value })}
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="areaDescInput" className="form-label">Descripción</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-card-text" aria-hidden="true"></i></span>
              <input
                id="areaDescInput"
                type="text"
                className="form-control"
                placeholder="Ej. Zona exterior con estufas..."
                value={areaFormData.description}
                onChange={e => setAreaFormData({ ...areaFormData, description: e.target.value })}
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setIsAreaModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-brand btn fw-semibold">
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
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-hash" aria-hidden="true"></i></span>
                <input
                  id="tableNumberInput"
                  type="number"
                  min="1"
                  className="form-control"
                  required
                  value={tableFormData.number}
                  onChange={e => setTableFormData({ ...tableFormData, number: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="col-6">
              <label htmlFor="tableCapacityInput" className="form-label">Capacidad (Personas) *</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-people-fill" aria-hidden="true"></i></span>
                <input
                  id="tableCapacityInput"
                  type="number"
                  min="1"
                  className="form-control"
                  required
                  value={tableFormData.capacity}
                  onChange={e => setTableFormData({ ...tableFormData, capacity: parseInt(e.target.value) || 2 })}
                />
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label d-block">Área Asignada *</label>
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
            <button type="button" className="btn btn-outline-secondary" onClick={() => setIsTableModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-brand btn fw-semibold" disabled={!tableFormData.areaId}>
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

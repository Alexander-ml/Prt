import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { PageHeader } from '../components/common/PageHeader';

export const DashboardPage: React.FC = () => {
  const { tables, orders, sales, insumos, currentRole, setCurrentRole } = useApp();
  const navigate = useNavigate();

  // Metrics
  const totalTables     = tables.length;
  const occupiedTables  = tables.filter(t => t.status === 'ocupada').length;
  const reservedTables  = tables.filter(t => t.status === 'reservada').length;
  const availableTables = tables.filter(t => t.status === 'disponible').length;
  const activeOrders    = orders.filter(o => o.status !== 'cerrado' && o.status !== 'cancelado');
  const todaySalesTotal = sales.filter(s => !s.isCancelled).reduce((sum, s) => sum + s.total, 0);
  const lowStockInsumos = insumos.filter(i => i.currentStock <= i.minStock);
  const occupancyPct    = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

  return (
    <div className="container-fluid p-0">

      {/* Page Header */}
      <PageHeader
        icon="bi-speedometer2"
        title="Panel de Control"
        subtitle="Visión en tiempo real de la operación, sala, cocina y situación financiera del restaurante."
        actions={
          <>
            <button
              className="btn btn-sm btn-outline-primary fw-semibold"
              style={{ borderRadius: 8 }}
              onClick={() => navigate('/mesas')}
            >
              <i className="bi bi-diagram-3 me-1"></i>
              Ir a Mesas
            </button>
            <button
              className="btn-brand btn btn-sm fw-semibold"
              style={{ borderRadius: 8 }}
              onClick={() => navigate('/pedidos')}
            >
              <i className="bi bi-plus-lg me-1"></i>
              Nuevo Pedido
            </button>
          </>
        }
      />

      {/* Role Switcher Banner */}
      <div
        className="alert-prototype rounded-3 p-3 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3"
      >
        <div className="d-flex align-items-center gap-3">
          <div
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--color-brand)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className="bi bi-magic" style={{ color: '#fff', fontSize: '1.1rem' }}></i>
          </div>
          <div>
            <div className="fw-bold" style={{ fontSize: '0.95rem' }}>
              Modo Prototipo Interactivo Activo
            </div>
            <div style={{ fontSize: '0.82rem', color: '#4338ca', marginTop: '0.15rem' }}>
              Rol actual: <strong>{currentRole}</strong>. Cambia de rol para explorar distintas perspectivas del sistema.
            </div>
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {(['Administrador', 'Mesero', 'Cocina'] as const).map(role => (
            <button
              key={role}
              className={`btn btn-sm fw-semibold ${currentRole === role ? 'btn-primary' : 'btn-outline-primary bg-white'}`}
              style={{ borderRadius: 8, fontSize: '0.8rem' }}
              onClick={() => setCurrentRole(role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4 stagger-children">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Mesas Ocupadas"
            value={`${occupiedTables} / ${totalTables}`}
            subtitle={`${reservedTables} reservadas · ${availableTables} disponibles`}
            icon="bi-table"
            colorTheme="emerald"
            trend={{ value: `${occupancyPct}% ocupación`, positive: occupancyPct < 90 }}
            onClick={() => navigate('/mesas')}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Pedidos Activos"
            value={activeOrders.length}
            subtitle={`${activeOrders.filter(o => o.status === 'en_preparacion').length} en cocina ahora`}
            icon="bi-receipt"
            colorTheme="indigo"
            onClick={() => navigate('/pedidos')}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Ventas del Día"
            value={`S/ ${todaySalesTotal.toFixed(2)}`}
            subtitle={`${sales.filter(s => !s.isCancelled).length} comprobantes emitidos`}
            icon="bi-cash-stack"
            colorTheme="sky"
            trend={{ value: '+12%', positive: true }}
            onClick={() => navigate('/ventas')}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Alertas de Stock"
            value={lowStockInsumos.length}
            subtitle={lowStockInsumos.length > 0 ? 'Insumos bajo mínimo' : 'Todos los insumos OK'}
            icon="bi-box-seam-fill"
            colorTheme={lowStockInsumos.length > 0 ? 'rose' : 'emerald'}
            onClick={() => navigate('/inventario')}
          />
        </div>
      </div>

      {/* Occupancy progress */}
      <div className="section-card mb-4">
        <div className="section-card-body py-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Ocupación actual del restaurante
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {occupancyPct}%
            </span>
          </div>
          <div className="progress" style={{ height: 8, borderRadius: 99 }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{
                width: `${occupancyPct}%`,
                background: occupancyPct > 80
                  ? 'linear-gradient(90deg, #ef4444, #f87171)'
                  : occupancyPct > 50
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #10b981, #34d399)',
                borderRadius: 99,
                transition: 'width 0.6s ease',
              }}
              aria-valuenow={occupancyPct}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
          <div className="d-flex justify-content-between mt-2">
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span style={{ color: '#10b981', fontWeight: 700 }}>●</span> {availableTables} disponibles
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>●</span> {occupiedTables} ocupadas
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span style={{ color: '#f59e0b', fontWeight: 700 }}>●</span> {reservedTables} reservadas
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="row g-4">
        {/* Left: Floorplan Mini */}
        <div className="col-12 col-lg-7">
          <div className="section-card h-100">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <i className="bi bi-grid-fill"></i>
                Estado de Mesas en Sala
              </h2>
              <button
                className="btn btn-sm btn-outline-primary fw-semibold"
                style={{ borderRadius: 8, fontSize: '0.78rem' }}
                onClick={() => navigate('/mesas')}
              >
                Ver plano completo
                <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
            <div className="section-card-body">
              <div className="row g-3">
                {tables.slice(0, 8).map(table => (
                  <div key={table.id} className="col-6 col-sm-4 col-md-3">
                    <div
                      className={`table-card status-${table.status}`}
                      onClick={() => navigate('/mesas')}
                      role="button"
                      aria-label={`Mesa ${table.number}, estado: ${table.status}`}
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && navigate('/mesas')}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-auto">
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          #{table.number}
                        </span>
                        <span className="table-status-pill">{table.status}</span>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {table.areaName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: 2 }}>
                          <i className="bi bi-people me-1"></i>
                          {table.capacity} personas
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {tables.length > 8 && (
                <div
                  className="text-center mt-3 pt-3 border-top"
                  style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}
                >
                  <i className="bi bi-grid me-1"></i>
                  {tables.length - 8} mesas más en el plano completo
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Kitchen + Stock */}
        <div className="col-12 col-lg-5">
          <div className="d-flex flex-column gap-4 h-100">

            {/* Kitchen Feed */}
            <div className="section-card flex-shrink-0">
              <div className="section-card-header">
                <h2 className="section-card-title">
                  <i className="bi bi-fire" style={{ color: '#d97706' }}></i>
                  Pedidos en Preparación
                </h2>
                <button
                  className="btn btn-sm btn-outline-secondary fw-semibold"
                  style={{ borderRadius: 8, fontSize: '0.75rem' }}
                  onClick={() => navigate('/cocina')}
                >
                  Ver KDS <i className="bi bi-arrow-right ms-1"></i>
                </button>
              </div>
              <div className="section-card-body p-3">
                {activeOrders.filter(o => o.status === 'en_preparacion').length === 0 ? (
                  <div className="text-center py-3" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <i className="bi bi-check-circle d-block mb-2" style={{ fontSize: '1.75rem', color: '#10b981' }}></i>
                    Sin pedidos pendientes en cocina.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {activeOrders
                      .filter(o => o.status === 'en_preparacion')
                      .slice(0, 5)
                      .map(ord => (
                        <div
                          key={ord.id}
                          className="d-flex align-items-center justify-content-between p-2 rounded-3"
                          style={{ background: 'var(--color-amber-bg)', border: '1px solid #fcd34d' }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              Mesa #{ord.tableNumber}
                              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                                {' '}— {ord.waiterName}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                              {ord.items.length} platos · {ord.sentToKitchenAt || 'en proceso'}
                            </div>
                          </div>
                          <Badge status="Preparando" variant="warning" icon="bi-arrow-repeat" />
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Stock Alerts */}
            <div className="section-card flex-grow-1">
              <div className="section-card-header">
                <h2 className="section-card-title">
                  <i className="bi bi-exclamation-triangle-fill" style={{ color: '#e11d48' }}></i>
                  Alertas de Insumos
                </h2>
                {currentRole === 'Administrador' && (
                  <button
                    className="btn btn-sm btn-outline-danger fw-semibold"
                    style={{ borderRadius: 8, fontSize: '0.75rem' }}
                    onClick={() => navigate('/inventario')}
                  >
                    Gestionar <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                )}
              </div>
              <div className="section-card-body p-3">
                {lowStockInsumos.length === 0 ? (
                  <div className="text-center py-3" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <i className="bi bi-shield-check d-block mb-2" style={{ fontSize: '1.75rem', color: '#10b981' }}></i>
                    Todos los insumos con stock suficiente.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {lowStockInsumos.map(ins => {
                      const pct = Math.min(100, Math.round((ins.currentStock / ins.minStock) * 100));
                      return (
                        <div key={ins.id} className="p-2 rounded-3" style={{ background: '#fff7f7', border: '1px solid #fca5a5' }}>
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span style={{ fontWeight: 700, fontSize: '0.83rem', color: 'var(--text-primary)' }}>
                              {ins.name}
                            </span>
                            <Badge status="Stock Bajo" variant="danger" />
                          </div>
                          <div style={{ fontSize: '0.73rem', color: '#e11d48', marginBottom: 4 }}>
                            {ins.currentStock} {ins.unit} disponibles (mín: {ins.minStock} {ins.unit})
                          </div>
                          <div className="stock-progress-bar">
                            <div
                              className={`stock-progress-fill ${pct < 50 ? 'critical' : 'low'}`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

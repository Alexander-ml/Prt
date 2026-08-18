import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { PageHeader } from '../components/common/PageHeader';

export const DashboardPage: React.FC = () => {
  const { tables, orders, sales, insumos, currentRole } = useApp();
  const navigate = useNavigate();

  // Metrics
  const totalTables     = tables.length;
  const occupiedTables  = tables.filter(t => t.status === 'ocupada').length;
  const reservedTables  = tables.filter(t => t.status === 'reservada').length;
  const availableTables = tables.filter(t => t.status === 'disponible').length;

  const activeOrders    = orders.filter(o => o.status !== 'cerrado' && o.status !== 'cancelado');
  const openOrders = activeOrders.filter(order => order.status === 'abierto').length;
  const preparingOrders = activeOrders.filter(order => order.status === 'en_preparacion').length;
  const readyOrders = activeOrders.filter(order => order.status === 'listo').length;

  const todaySalesTotal = sales.filter(s => !s.isCancelled).reduce((sum, s) => sum + s.total, 0);

  const lowStockInsumos = insumos.filter(insumo => insumo.currentStock <= insumo.minStock);
  const criticalStockInsumos = insumos.filter(insumo => insumo.currentStock <= insumo.minStock * 0.5);
  const lowStockCount =lowStockInsumos.length - criticalStockInsumos.length;

  const occupancyPct    = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

  return (
    <div className="container-fluid p-0">

      {/* Page Header */}
      <PageHeader
        icon="bi-speedometer2"
        title="Panel de Control"
        subtitle="Visión en tiempo real de la operación, sala, cocina y situación financiera del restaurante."
        
      />

      {/* KPI Cards */}
      <div className="row g-3 mb-4 stagger-children">
        <div className="col-12 col-md-6 col-lg-3">
          <StatCard
            title="Mesas Ocupadas"
            value={`${occupiedTables} / ${totalTables}`}
            subtitle={`${occupiedTables} ocupadas · ${reservedTables} reservadas · ${availableTables} disponibles`}
            icon="bi-table"
            colorTheme="emerald"
            trend={{ value: `${occupancyPct}% ocupación`, positive: occupancyPct < 90 }}
            progress={{
              segments: [
                { count: occupiedTables, color: '#ef4444' },   // ocupadas : rojo
                { count: reservedTables, color: '#f59e0b' },   // reservadas : ámbar
                { count: availableTables, color: '#10b981' },  // disponibles : verde
              ],
              total: totalTables,
            }}
            onClick={() => navigate('/mesas')}
          />
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <StatCard
            title="Pedidos Activos"
            value={activeOrders.length}
            subtitle={`${preparingOrders} en cocina · ${readyOrders} listos · ${openOrders} abiertos`}
            icon="bi-receipt"
            colorTheme="indigo"
            onClick={() => navigate('/pedidos')}
          />
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <StatCard
            title="Ventas del Día"
            value={`S/ ${todaySalesTotal.toFixed(2)}`}
            subtitle={`${sales.filter(s => !s.isCancelled).length} comprobantes emitidos`}
            icon="bi-cash-stack"
            colorTheme="sky"
            onClick={() => navigate('/ventas')}
          />
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <StatCard
            title="Alertas de Stock"
            value={lowStockInsumos.length}
            subtitle={lowStockInsumos.length > 0? `${criticalStockInsumos.length} críticos · ${lowStockCount} bajo mínimo`: 'Todos los insumos dentro del mínimo'}
            icon="bi-box-seam-fill"
            colorTheme={lowStockInsumos.length > 0 ? 'rose' : 'emerald'}
            onClick={() => navigate('/inventario')}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="row g-4">
        {/* Left: Floorplan Mini — segunda prioridad visual en móvil */}
        <div className="col-12 col-lg-7 order-2 order-lg-1">
          <div className="section-card h-100">
            <div className="section-card-header flex-wrap gap-2">
              <h2 className="section-card-title">
                <i className="bi bi-grid-fill" aria-hidden="true"></i>
                Estado de Mesas en Sala
              </h2>
              <button
                className="btn btn-sm btn-outline-primary fw-semibold"
                style={{ borderRadius: 8, fontSize: '0.78rem' }}
                onClick={() => navigate('/mesas')}
              >
                Ver plano completo
                <i className="bi bi-arrow-right ms-1" aria-hidden="true"></i>
              </button>
            </div>
            <div className="section-card-body">
              <div className="row g-2">
                {tables.slice(0, 8).map(table => (
                  <div key={table.id} className="col-12 col-md-6">
                    <div
                      className={`table-card status-${table.status}`}
                      onClick={() => navigate('/mesas')}
                      role="button"
                      aria-label={`Mesa ${table.number}, estado: ${table.status}`}
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && navigate('/mesas')}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        minHeight: 68,
                      }}
                    >
                      <div
                        className="d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: 'rgba(0,0,0,0.04)',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)',
                        }}
                        aria-hidden="true"
                      >
                        #{table.number}
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <span
                            className="text-truncate"
                            style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}
                          >
                            {table.areaName}
                          </span>
                          <span className="table-status-pill flex-shrink-0">{table.status}</span>
                        </div>
                        <div className="text-truncate" style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: 2 }}>
                          <i className="bi bi-people me-1" aria-hidden="true"></i>
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
                  <i className="bi bi-grid me-1" aria-hidden="true"></i>
                  {tables.length - 8} mesas más en el plano completo
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Kitchen + Stock — primera prioridad visual en móvil (accionable/urgente) */}
        <div className="col-12 col-lg-5 order-1 order-lg-2">
          <div className="d-flex flex-column gap-4 h-100">

            {/* Kitchen Feed */}
            <div className="section-card flex-shrink-0">
              <div className="section-card-header flex-wrap gap-2">
                <h2 className="section-card-title">
                  <i className="bi bi-fire" style={{ color: '#d97706' }} aria-hidden="true"></i>
                  Pedidos en Preparación
                </h2>
                <button
                  className="btn btn-sm btn-outline-secondary fw-semibold"
                  style={{ borderRadius: 8, fontSize: '0.75rem' }}
                  onClick={() => navigate('/cocina')}
                >
                  Ver KDS <i className="bi bi-arrow-right ms-1" aria-hidden="true"></i>
                </button>
              </div>
              <div className="section-card-body p-3">
                {activeOrders.filter(o => o.status === 'en_preparacion').length === 0 ? (
                  <div className="text-center py-3" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <i className="bi bi-check-circle d-block mb-2" style={{ fontSize: '1.75rem', color: '#10b981' }} aria-hidden="true"></i>
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
                          className="d-flex align-items-center justify-content-between gap-2 p-2 rounded-3"
                          style={{ background: 'var(--color-amber-bg)', border: '1px solid #fcd34d' }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div className="text-truncate" style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              Mesa #{ord.tableNumber}
                              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                                {' '}  {ord.waiterName}
                              </span>
                            </div>
                            <div className="text-truncate" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                              {ord.items.length} platos · {ord.sentToKitchenAt || 'en proceso'}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <Badge status="Preparando" variant="warning" icon="bi-arrow-repeat" />
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Stock Alerts */}
            <div className="section-card flex-grow-1">
              <div className="section-card-header flex-wrap gap-2">
                <h2 className="section-card-title">
                  <i className="bi bi-exclamation-triangle-fill" style={{ color: '#e11d48' }} aria-hidden="true"></i>
                  Alertas de Insumos
                </h2>
                {currentRole === 'Administrador' && (
                  <button
                    className="btn btn-sm btn-outline-danger fw-semibold"
                    style={{ borderRadius: 8, fontSize: '0.75rem' }}
                    onClick={() => navigate('/inventario')}
                  >
                    Gestionar <i className="bi bi-arrow-right ms-1" aria-hidden="true"></i>
                  </button>
                )}
              </div>
              <div className="section-card-body p-3">
                {lowStockInsumos.length === 0 ? (
                  <div className="text-center py-3" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <i className="bi bi-shield-check d-block mb-2" style={{ fontSize: '1.75rem', color: '#10b981' }} aria-hidden="true"></i>
                    Todos los insumos con stock suficiente.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {lowStockInsumos.map(ins => {
                      const pct = Math.min(100, Math.round((ins.currentStock / ins.minStock) * 100));
                      return (
                        <div key={ins.id} className="p-2 rounded-3" style={{ background: '#fff7f7', border: '1px solid #fca5a5' }}>
                          <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                            <span className="text-truncate" style={{ fontWeight: 700, fontSize: '0.83rem', color: 'var(--text-primary)', minWidth: 0 }}>
                              {ins.name}
                            </span>
                            <div className="flex-shrink-0">
                              <Badge status="Stock Bajo" variant="danger" />
                            </div>
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

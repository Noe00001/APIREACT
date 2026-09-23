import React, { useState, useEffect } from 'react';
import { getDashboardMetrics, downloadFile, getProducts, getServices, getUsers } from '../../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Users, ShoppingCart, FileText, Download, TrendingUp, AlertCircle, RefreshCw, Filter } from 'lucide-react';

const COLORS = ['#d39c6b', '#8b5a2b', '#2c3e50', '#e74c3c'];

const AnalyticsTab = ({ userRole }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [productsList, setProductsList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [clientsList, setClientsList] = useState([]);

  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    producto_id: '',
    servicio_id: '',
    estado: '',
    cliente_id: ''
  });

  const loadData = async (activeFilters = filters) => {
    try {
      setLoading(true);
      setError('');
      const data = await getDashboardMetrics(activeFilters);
      setMetrics(data);
    } catch (err) {
      setError(err.message || 'Error cargando analíticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Cargar listas para filtros de producto, servicio y cliente
    Promise.all([
      getProducts().catch(() => []),
      getServices().catch(() => []),
      (userRole === 'Administrador' || userRole === 'Empleado') ? getUsers().catch(() => []) : Promise.resolve([])
    ]).then(([prods, servs, usrs]) => {
      setProductsList(prods.filter(p => p.estado === 'Activo'));
      setServicesList(servs.filter(s => s.estado === 'Activo'));
      setClientsList(usrs.filter(u => u.rol === 'Cliente' && u.estado === 'Activo'));
    });
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadData(filters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      fecha_inicio: '',
      fecha_fin: '',
      producto_id: '',
      servicio_id: '',
      estado: '',
      cliente_id: ''
    };
    setFilters(emptyFilters);
    loadData(emptyFilters);
  };

  const handleDownloadReport = async (format) => {
    try {
      const params = new URLSearchParams();
      if (filters.fecha_inicio) params.append('fecha', filters.fecha_inicio);
      const filename = format === 'pdf' ? 'Reporte_Ventas.pdf' : 'Reporte_Ventas.xlsx';
      await downloadFile(`/reportes/diario/${format}?${params.toString()}`, filename);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading && !metrics) return <div className="p-4 text-center">Cargando indicadores...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!metrics) return null;

  const { kpis, ventas_por_dia, ventas_por_categoria, top_mas_vendidos } = metrics;

  const hasActiveFilters = Boolean(
    filters.fecha_inicio || filters.fecha_fin || filters.producto_id ||
    filters.servicio_id || filters.estado || filters.cliente_id
  );

  return (
    <div className="analytics-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER Y FILTROS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>Reporte de Adopciones y Servicios</h3>
          <p style={{ margin: 0, color: 'var(--text-light)' }}>Monitoreo en tiempo real de operaciones</p>
        </div>

        {userRole === 'Administrador' && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => handleDownloadReport('pdf')} className="btn-action-primary" style={{ background: '#c0392b' }}>
              <Download size={16} /> Reporte PDF
            </button>
            <button onClick={() => handleDownloadReport('excel')} className="btn-action-primary" style={{ background: '#27ae60' }}>
              <Download size={16} /> Reporte Excel
            </button>
          </div>
        )}
      </div>

      {/* PANEL DE FILTROS AVANZADOS */}
      <form onSubmit={handleFilterSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--text-light)' }}>Fecha Inicial</label>
          <input 
            type="date" 
            value={filters.fecha_inicio} 
            onChange={(e) => setFilters({...filters, fecha_inicio: e.target.value})}
            style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--text-light)' }}>Fecha Final</label>
          <input 
            type="date" 
            value={filters.fecha_fin} 
            onChange={(e) => setFilters({...filters, fecha_fin: e.target.value})}
            style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--text-light)' }}>Producto</label>
          <select
            value={filters.producto_id}
            onChange={(e) => setFilters({...filters, producto_id: e.target.value})}
            style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem', minWidth: '130px' }}
          >
            <option value="">Todos los productos</option>
            {productsList.map(p => (
              <option key={`p-${p.id}`} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--text-light)' }}>Servicio</label>
          <select
            value={filters.servicio_id}
            onChange={(e) => setFilters({...filters, servicio_id: e.target.value})}
            style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem', minWidth: '130px' }}
          >
            <option value="">Todos los servicios</option>
            {servicesList.map(s => (
              <option key={`s-${s.id}`} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--text-light)' }}>Estado Venta</label>
          <select
            value={filters.estado}
            onChange={(e) => setFilters({...filters, estado: e.target.value})}
            style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem', minWidth: '120px' }}
          >
            <option value="">Todos los estados</option>
            <option value="Completada">Completada</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>
        {(userRole === 'Administrador' || userRole === 'Empleado') && (
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--text-light)' }}>Cliente</label>
            <select
              value={filters.cliente_id}
              onChange={(e) => setFilters({...filters, cliente_id: e.target.value})}
              style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem', minWidth: '140px' }}
            >
              <option value="">Todos los clientes</option>
              {clientsList.map(u => (
                <option key={`u-${u.id}`} value={u.id}>{u.nombre} {u.apellido}</option>
              ))}
            </select>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button type="submit" className="btn-action-primary" style={{ padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }} title="Aplicar Filtros">
            <Filter size={15} /> Filtrar
          </button>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} style={{ padding: '0.45rem 0.75rem', background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--brand-color)', cursor: 'pointer', fontSize: '0.85rem' }}>
              Limpiar
            </button>
          )}
        </div>
      </form>

      {/* KPIS (CARDS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {userRole === 'Administrador' && (
          <div className="dashboard-stat-card" style={{ alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
            <div style={{ background: '#e1f5fe', padding: '1rem', borderRadius: '50%', color: '#0288d1', marginBottom: '0.5rem' }}>
              <Users size={24} />
            </div>
            <div>
              <span className="stat-value">{kpis.total_usuarios}</span>
              <span className="stat-label">Usuarios</span>
            </div>
          </div>
        )}
        <div className="dashboard-stat-card" style={{ alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
          <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '50%', color: '#388e3c', marginBottom: '0.5rem' }}>
            <ShoppingCart size={24} />
          </div>
          <div>
            <span className="stat-value">{kpis.total_ventas}</span>
            <span className="stat-label">Operaciones Registradas</span>
          </div>
        </div>
        <div className="dashboard-stat-card" style={{ alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
          <div style={{ background: '#fff3e0', padding: '1rem', borderRadius: '50%', color: '#f57c00', marginBottom: '0.5rem' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="stat-value">${Number(kpis.facturacion_total).toLocaleString('es-CO')}</span>
            <span className="stat-label">Ingresos Totales</span>
          </div>
        </div>
        <div className="dashboard-stat-card" style={{ alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
          <div style={{ background: '#ffebee', padding: '1rem', borderRadius: '50%', color: '#d32f2f', marginBottom: '0.5rem' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <span className="stat-value">{kpis.pqrs_pendientes} / {kpis.pqrs_recibidas}</span>
            <span className="stat-label">PQR Pendientes</span>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', minHeight: '350px' }}>
        
        {/* Gráfico de Barras: Ventas por Día */}
        <div className="page-card" style={{ margin: 0 }}>
          <h4 style={{ marginBottom: '1rem', marginTop: 0 }}>Ingresos por Adopciones y Servicios</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ventas_por_dia}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
              <RechartsTooltip formatter={(value) => `$${Number(value).toLocaleString('es-CO')}`} />
              <Bar dataKey="valor" fill="var(--brand-color)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico Lineal: Volumen de Ventas */}
        <div className="page-card" style={{ margin: 0 }}>
          <h4 style={{ marginBottom: '1rem', marginTop: 0 }}>Volumen de Transacciones</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ventas_por_dia}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <RechartsTooltip />
              <Line type="monotone" dataKey="cantidad" stroke="#3498db" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Productos más vendidos */}
        <div className="dashboard-table-wrap" style={{ margin: 0, overflow: 'hidden' }}>
          <h4 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid var(--border-color)' }}>Top 5 (Gatos y Servicios)</h4>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Ítem</th>
                <th>Cantidad</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {top_mas_vendidos.length === 0 ? (
                <tr><td colSpan="3" style={{textAlign: 'center'}}>No hay datos suficientes</td></tr>
              ) : top_mas_vendidos.map((item, idx) => (
                <tr key={idx}>
                  <td><strong>{item.label}</strong></td>
                  <td>{item.cantidad}</td>
                  <td>${Number(item.valor).toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Distribución Categorías */}
        <div className="page-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ marginBottom: '1rem', marginTop: 0 }}>Distribución por Categoría</h4>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={ventas_por_categoria}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="valor"
                >
                  {ventas_por_categoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => `$${Number(value).toLocaleString('es-CO')}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AnalyticsTab;

import React, { useState, useEffect } from 'react';
import { getFacturas, downloadFile } from '../../services/api';
import { Download, FileText, Search } from 'lucide-react';

const FacturasTab = ({ userRole, searchTerm = '' }) => {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFacturas = async () => {
    try {
      setLoading(true);
      const data = await getFacturas();
      setFacturas(data);
    } catch (err) {
      setError(err.message || 'Error cargando facturas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacturas();
  }, []);

  const handleDownloadPDF = async (id, numero) => {
    try {
      await downloadFile(`/facturas/${id}/pdf`, `${numero}.pdf`);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredFacturas = facturas.filter(f => 
    f.numero_factura.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (f.cliente_nombre && f.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="facturas-container">
      <div className="dashboard-heading" style={{ marginBottom: '1rem' }}>
        <div>
          <h3>Certificados y Comprobantes</h3>
          <span className="table-subtitle">Emisión y consulta de certificados de adopción y comprobantes de servicios</span>
        </div>
      </div>

      {error && <div className="dashboard-toast error">{error}</div>}

      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>No. Certificado</th>
              <th>Operación Asociada</th>
              <th>Fecha Emisión</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Documento</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>Cargando...</td></tr>
            ) : filteredFacturas.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No se encontraron certificados.</td></tr>
            ) : (
              filteredFacturas.map(f => (
                <tr key={f.id}>
                  <td><strong>{f.numero_factura}</strong></td>
                  <td>{f.numero_venta}</td>
                  <td>{new Date(f.fecha_emision).toLocaleDateString()}</td>
                  <td>{f.cliente_nombre || 'Desconocido'}</td>
                  <td><strong>${Number(f.total).toLocaleString('es-CO')}</strong></td>
                  <td>
                    <span className={`badge-status ${f.estado === 'Pagada' ? 'status-activo' : f.estado === 'Anulada' ? 'status-inactivo' : 'status-pendiente'}`}>
                      {f.estado}
                    </span>
                  </td>
                  <td className="action-buttons-cell">
                    <button 
                      className="btn-sm btn-edit" 
                      onClick={() => handleDownloadPDF(f.id, f.numero_factura)}
                      title="Descargar PDF"
                    >
                      <Download size={14} style={{ marginRight: '4px' }} /> PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FacturasTab;

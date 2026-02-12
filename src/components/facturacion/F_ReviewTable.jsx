import React from 'react';
import '../../styles/btn.css';
import '../../styles/Facturacion/F_ReviewTable.css';

const ReviewTable = ({ data, qboAccounts, qboVendors, onUpdateItem, onSendToQBO, onClearTable }) => {
  if (!data) return null;

  // Calculamos totales dinámicamente con precisión
  const totalITBMS = data.items.reduce((acc, i) => acc + (Number(i.valITBMS) || 0), 0);
  const totalFactura = data.items.reduce((acc, i) => acc + (Number(i.totalItem) || 0), 0);

  return (
    <div className="review-card">
      <div className="review-header">
        <div>
          <h3 className="provider-title">Factura de: {data.proveedor}</h3>
          
          {/* Selector de Proveedor QBO */}
          <div style={{ marginTop: '10px' }}>
            <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              Vincular con Proveedor en QBO:
            </label>
            <select 
              className="input-ghost" // Usando clase existente para mantener estilo
              style={{ 
                display: 'block', 
                width: '100%', 
                marginTop: '5px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                padding: '4px 8px'
              }}
              value={data.vendorId || ''}
              onChange={(e) => onUpdateItem('header', 'vendorId', e.target.value)}
            >
              <option value="">-- Seleccionar Proveedor de QuickBooks --</option>
              {qboVendors.map((v) => (
                <option key={v.Id} value={v.Id}>
                  {v.DisplayName}
                </option>
              ))}
            </select>
          </div>

          <p className="ruc-info" style={{ marginTop: '8px' }}>
            RUC: {data.ruc} | CUFE: {data.cufe?.substring(0, 45)}...
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-danger" onClick={onClearTable}>Vaciar Tabla</button>
          <button className="btn btn-primary">Guardar Borrador</button>
        </div>
      </div>

      <div className="table-scroll-container">
        <table className="review-table">
          <thead>
            <tr>
              <th className="text-center">7%</th>
              <th style={{ width: '400px' }}>Descripción</th>
              <th className="text-center">Cant.</th>
              <th>Precio Unit. (Neto)</th>
              <th>ITBMS</th>
              <th>Total</th>
              <th style={{ width: '250px' }}>Cuenta QBO</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index}>
                <td className="text-center">
                  <div className="tax-toggle-container">
                    <input 
                      type="checkbox" 
                      className="custom-tax-checkbox"
                      checked={item.taxSelected || false} 
                      onChange={(e) => onUpdateItem(index, 'taxSelected', e.target.checked)}
                    />
                  </div>
                </td>
                <td>
                  <input 
                    className="input-ghost" 
                    value={item.descripcion} 
                    onChange={(e) => onUpdateItem(index, 'descripcion', e.target.value)}
                  />
                </td>
                <td className="text-center">{item.cantidad}</td>
                <td>B/. {Number(item.precioUnitario).toFixed(2)}</td>
                <td className={`tax-value ${item.taxSelected ? 'active' : ''}`}>
                  {Number(item.valITBMS || 0).toFixed(2)}
                </td>
                <td className="total-cell">B/. {Number(item.totalItem).toFixed(2)}</td>
                <td>
                  <select 
                    className="input-ghost" 
                    value={item.account || ''}
                    onChange={(e) => onUpdateItem(index, 'account', e.target.value)}
                  >
                    <option value="">Seleccionar cuenta...</option>
                    {qboAccounts.map((acc) => (
                      <option key={acc.Id} value={acc.Id}>
                        {acc.Name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="review-footer">
        <div className="footer-content">
          <div className="totals-summary">
            <div className="summary-item">
              <span>ITBMS TOTAL</span>
              <strong>B/. {totalITBMS.toFixed(2)}</strong>
            </div>
            <div className="summary-item total-main">
              <span>TOTAL FACTURA</span>
              <strong>B/. {totalFactura.toFixed(2)}</strong>
            </div>
          </div>
          <button className="btn btn-success" onClick={onSendToQBO} style={{padding: '12px 25px'}}>
            Ingresar a QuickBooks
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewTable;
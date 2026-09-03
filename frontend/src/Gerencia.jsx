import React, { useState, useEffect } from 'react';
import { Database, TrendingDown } from 'lucide-react';
import axios from 'axios';

export default function Gerencia() {
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    try {
      const respuesta = await axios.get('http://localhost:3000/api/rollos');
      setInventario(respuesta.data);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div className="container">
      <h2 className="titulo-principal" style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        <Database size={28} color="#0ea5e9" /> 
        Panel de Control - Inventario Global
      </h2>

      {cargando ? (
        <p style={{ color: '#64748b', textAlign: 'center', marginTop: '50px' }}>Cargando datos de la bodega...</p>
      ) : (
        <div style={{ marginTop: '30px', overflowX: 'auto' }}>
          <table className="tabla-inventario">
            <thead>
              <tr>
                <th>Código QR</th>
                <th>Tipo de Tela</th>
                <th>Color</th>
                <th>Metraje Actual</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {inventario.map((rollo) => (
                <tr key={rollo.id}>
                  <td style={{ fontWeight: 'bold', color: '#0f172a' }}>{rollo.codigo_qr}</td>
                  <td>{rollo.tipo_tela}</td>
                  <td>{rollo.color}</td>
                  <td style={{ fontWeight: 'bold', color: '#059669' }}>{rollo.metraje_actual} m</td>
                  <td>
                    {rollo.metraje_actual < 20 ? (
                      <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', width: 'fit-content' }}>
                        <TrendingDown size={14} /> Stock Bajo
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                        Óptimo
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
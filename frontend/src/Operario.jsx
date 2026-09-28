import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from './api';

export default function Operario() {
  const [resultadoQR, setResultadoQR] = useState(null);
  const [metros, setMetros] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!resultadoQR) {
      const scanner = new Html5QrcodeScanner('lector-camara', {
        qrbox: { width: 250, height: 250 },
        fps: 5,
      });

      scanner.render(
        (textoDecodificado) => {
          scanner.clear();
          setResultadoQR(textoDecodificado);
        },
        () => {}
      );

      return () => {
        scanner.clear().catch((err) => console.error("Error al apagar cámara", err));
      };
    }
  }, [resultadoQR]);

  const procesarCorte = async () => {
    if (!metros || metros <= 0) {
      alert("Por favor, ingresa una cantidad válida de metros.");
      return;
    }

    setCargando(true);
    
    try {
      const respuesta = await api.post('/cortes', {
        codigo_qr: resultadoQR,
        metros_cortados: parseFloat(metros),
      });

      alert(`✅ ¡Corte exitoso! Nuevo saldo: ${respuesta.data.nuevo_saldo} metros.`);
      setResultadoQR(null);
      setMetros('');
    } catch (error) {
      alert(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px' }}>
      <h2 className="titulo-principal">Panel Operativo</h2>
      
      {!resultadoQR ? (
        <div style={{ marginTop: '20px' }}>
          <div id="lector-camara" style={{ width: '100%', borderRadius: '10px', overflow: 'hidden' }}></div>
          <p style={{ marginTop: '15px', color: '#64748b', textAlign: 'center' }}>Apunta la cámara al código QR.</p>
        </div>
      ) : (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#dcfce7', borderRadius: '12px', border: '2px solid #22c55e', textAlign: 'center' }}>
          <h3 style={{ color: '#15803d', margin: '0 0 10px 0' }}>¡Rollo Detectado!</h3>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#166534', margin: '0 0 15px 0' }}>{resultadoQR}</p>
          
          <input 
            type="number" 
            placeholder="¿Cuántos metros vas a cortar?" 
            value={metros}
            onChange={(e) => setMetros(e.target.value)}
            className="input-estilizado"
          />
          
          <button 
            onClick={procesarCorte}
            disabled={cargando}
            className="btn-primario"
            style={{ backgroundColor: cargando ? '#93c5fd' : '', cursor: cargando ? 'not-allowed' : 'pointer' }}
          >
            {cargando ? 'Procesando...' : 'Descontar Metraje'}
          </button>
          
          <button 
            onClick={() => { setResultadoQR(null); setMetros(''); }}
            className="btn-secundario"
          >
            Cancelar y escanear otro
          </button>
        </div>
      )}
    </div>
  );
}
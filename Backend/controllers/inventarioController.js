const { obtenerTodosLosRollos, buscarRolloPorQr, registrarCorte } = require('../models/inventarioModel');

const obtenerRollos = async (req, res) => {
  try {
    const rollos = await obtenerTodosLosRollos();
    res.json(rollos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const descontarMetraje = async (req, res) => {
  const { codigo_qr, metros_cortados } = req.body;
  const cantidad = Number(metros_cortados);
  
  if (typeof codigo_qr !== 'string' || !Number.isFinite(cantidad) || cantidad <= 0) {
    return res.status(400).json({ error: 'Ingresa un código QR y una cantidad válida.' });
  }
  
  try {
    const rollo = await buscarRolloPorQr(codigo_qr.trim());
    if (!rollo) {
        return res.status(404).json({ error: 'Rollo no encontrado en la bodega' });
    }
    
    const nuevo_metraje = rollo.metraje_actual - cantidad;

    if (nuevo_metraje < 0) {
        return res.status(400).json({ error: `Metraje insuficiente. Solo quedan ${rollo.metraje_actual} metros.` });
    }

    await registrarCorte(rollo.id, nuevo_metraje, cantidad, req.usuario.email);

    res.json({ 
        mensaje: 'Corte registrado con éxito', 
        metros_descontados: cantidad,
        nuevo_saldo: nuevo_metraje 
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { obtenerRollos, descontarMetraje };
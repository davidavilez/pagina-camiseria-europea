const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a PostgreSQL (Docker)
const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'inventario_telas',
  password: 'password123',
  port: 5432,
});

// Endpoint 1: Ver todos los rollos (Para el Dashboard Gerencial)
app.get('/api/rollos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rollos ORDER BY fecha_ingreso DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint 2: Descontar metraje (El que usará el operario al escanear)
app.post('/api/cortes', async (req, res) => {
  const { codigo_qr, metros_cortados, operario_id } = req.body;
  
  try {
    // 1. Validar que el rollo exista
    const rolloQuery = await pool.query('SELECT id, metraje_actual FROM rollos WHERE codigo_qr = $1', [codigo_qr]);
    if (rolloQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Rollo no encontrado en la bodega' });
    }
    
    const rollo = rolloQuery.rows[0];
    const nuevo_metraje = rollo.metraje_actual - metros_cortados;

    // 2. Validar que haya tela suficiente
    if (nuevo_metraje < 0) {
        return res.status(400).json({ error: `Metraje insuficiente. Solo quedan ${rollo.metraje_actual} metros.` });
    }

    // 3. Actualizar el saldo del rollo y guardar el historial (Transacción)
    await pool.query('UPDATE rollos SET metraje_actual = $1 WHERE id = $2', [nuevo_metraje, rollo.id]);
    await pool.query('INSERT INTO cortes (rollo_id, metros_cortados, operario_id) VALUES ($1, $2, $3)', [rollo.id, metros_cortados, operario_id]);

    res.json({ 
        mensaje: 'Corte registrado con éxito', 
        metros_descontados: metros_cortados,
        nuevo_saldo: nuevo_metraje 
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor de Camisería Europea corriendo en http://localhost:${PORT}`);
});
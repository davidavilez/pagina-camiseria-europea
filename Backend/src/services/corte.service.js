const { withTransaction } = require('../config/db');
const rolloRepository = require('../repositories/rollo.repository');
const corteRepository = require('../repositories/corte.repository');
const { calcularEstadoStock } = require('./rollo.service');
const AppError = require('../utils/AppError');
const validar = require('../utils/validacion');

/**
 * Descuenta metraje de un rollo y registra el corte de forma atómica (ACID):
 *  1. BEGIN
 *  2. SELECT ... FOR UPDATE   -> bloquea el rollo frente a cortes concurrentes
 *  3. Valida metros_a_cortar <= metraje_actual
 *  4. UPDATE rollos + INSERT cortes
 *  5. COMMIT (o ROLLBACK si algo falla: nunca queda un descuento sin historial)
 */
const registrarCorte = async ({ rollo_id, metros_cortados }, operario) => {
  const rolloId = validar.idEntero(rollo_id, 'ID del rollo');
  const metros = validar.metros(metros_cortados, 'Metros a cortar');

  return withTransaction(async (client) => {
    const rollo = await rolloRepository.buscarPorIdParaActualizar(rolloId, client);
    if (!rollo) {
      throw AppError.notFound('El rollo no existe en la bodega.');
    }

    if (rollo.metraje_actual <= 0) {
      throw AppError.conflict(`El rollo ${rollo.codigo_sku} está agotado (0 m). No se puede cortar.`);
    }
    if (metros > rollo.metraje_actual) {
      throw AppError.conflict(
        `Metraje insuficiente: intentas cortar ${metros} m pero el rollo ${rollo.codigo_sku} ` +
        `solo tiene ${rollo.metraje_actual} m disponibles.`
      );
    }

    const rolloActualizado = await rolloRepository.descontarMetraje(rolloId, metros, client);
    const corte = await corteRepository.crear(
      { rolloId, operarioId: operario.id, metrosCortados: metros },
      client
    );

    return {
      corte,
      rollo: { ...rolloActualizado, estado_stock: calcularEstadoStock(rolloActualizado.metraje_actual) },
    };
  });
};

module.exports = { registrarCorte };

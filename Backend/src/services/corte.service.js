const { withTransaction } = require('../config/db');
const rolloRepository = require('../repositories/rollo.repository');
const corteRepository = require('../repositories/corte.repository');
const emailService = require('./email.service');
const { calcularEstadoStock } = require('./rollo.service');
const AppError = require('../utils/AppError');
const validar = require('../utils/validacion');

/**
 * Envía la alerta de stock crítico ya confirmada la transacción. Si el correo
 * falla se rearma el flag para que el próximo corte la reintente; nunca lanza,
 * así un problema de SMTP no afecta el corte ya registrado.
 */
const notificarStockCritico = async (rollo) => {
  try {
    await emailService.enviarAlertaStock(rollo);
  } catch (error) {
    console.error(`[correo] No se envió la alerta de stock del rollo ${rollo.codigo_sku}:`, error.message);
    await rolloRepository.marcarAlertaEnviada(rollo.id, false).catch(() => {});
  }
};

/**
 * Descuenta metraje de un rollo y registra el corte de forma atómica (ACID):
 *  1. BEGIN
 *  2. SELECT ... FOR UPDATE   -> bloquea el rollo frente a cortes concurrentes
 *  3. Valida metros_a_cortar <= metraje_actual
 *  4. UPDATE rollos + INSERT cortes
 *  5. DSS: si el saldo cae a <= stock_minimo y no se había alertado,
 *     marca alerta_enviada = true (en la misma transacción)
 *  6. COMMIT (o ROLLBACK si algo falla: nunca queda un descuento sin historial)
 *  7. Tras el COMMIT se envía el correo de alerta: el SMTP no puede revertir el corte.
 */
const registrarCorte = async ({ rollo_id, metros_cortados }, operario) => {
  const rolloId = validar.idEntero(rollo_id, 'ID del rollo');
  const metros = validar.metros(metros_cortados, 'Metros a cortar');

  const resultado = await withTransaction(async (client) => {
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

    let rolloActualizado = await rolloRepository.descontarMetraje(rolloId, metros, client);
    const corte = await corteRepository.crear(
      { rolloId, operarioId: operario.id, metrosCortados: metros },
      client
    );

    const debeAlertar = !rolloActualizado.alerta_enviada
      && rolloActualizado.metraje_actual <= rolloActualizado.stock_minimo;
    if (debeAlertar) {
      rolloActualizado = await rolloRepository.marcarAlertaEnviada(rolloId, true, client);
    }

    return { corte, rollo: rolloActualizado, debeAlertar };
  });

  if (resultado.debeAlertar) {
    notificarStockCritico(resultado.rollo); // no se espera: el operario recibe su respuesta de inmediato
  }

  return {
    corte: resultado.corte,
    rollo: { ...resultado.rollo, estado_stock: calcularEstadoStock(resultado.rollo) },
  };
};

module.exports = { registrarCorte };

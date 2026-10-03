import {
  sincronizarYCrearReservacionesEnDb,
  consultarEventosGoogleCalendar
} from '../services/googleCalendarService.js';

/**
 * Endpoint para sincronizar calendarios y crear automáticamente las reservaciones
 * en la base de datos (con pagos en estado pendiente/no pagado).
 * POST /api/reservaciones/sincronizar
 * POST /api/reservaciones/sincronizar/:cabanaId
 */
export async function sincronizarReservaciones(req, res) {
  try {
    const cabanaId = req.params.cabanaId || req.body?.cabana_id || req.query?.cabana_id || null;
    const resultado = await sincronizarYCrearReservacionesEnDb({ cabanaId });

    const status = resultado.exito ? 200 : 400;
    return res.status(status).json(resultado);
  } catch (error) {
    console.error('Error al sincronizar reservaciones en base de datos:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al sincronizar con Google Calendar',
      error: error.message
    });
  }
}

/**
 * Endpoint para consultar eventos desde Google Calendar (Lectura)
 * GET /api/reservaciones
 */
export async function obtenerReservaciones(req, res) {
  try {
    const cabanaId = req.query?.cabana_id || null;
    const resultado = await consultarEventosGoogleCalendar(cabanaId);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Error al consultar reservaciones de Google Calendar:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al consultar las reservaciones de Google Calendar',
      error: error.message
    });
  }
}

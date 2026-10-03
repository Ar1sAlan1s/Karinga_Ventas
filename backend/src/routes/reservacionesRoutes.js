import { Router } from 'express';
import {
  obtenerReservaciones,
  sincronizarReservaciones
} from '../controllers/reservacionesController.js';

const router = Router();

// GET /api/reservaciones -> Consultar eventos de Google Calendar
router.get('/', obtenerReservaciones);

// POST /api/reservaciones/sincronizar -> Sincronizar todos o una cabaña especificada en body/query
router.post('/sincronizar', sincronizarReservaciones);

// POST /api/reservaciones/sincronizar/:cabanaId -> Sincronizar cabaña individual por URL
router.post('/sincronizar/:cabanaId', sincronizarReservaciones);

export default router;

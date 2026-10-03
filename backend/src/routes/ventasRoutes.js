import { Router } from 'express';
import {
  crearVenta,
  obtenerVentas,
  obtenerReservasCalendario,
  asignarHorasExtra,
  liquidarSaldo,
  registrarDanoDeposito,
  descargarReporteExcel
} from '../controllers/ventasController.js';

const router = Router();

router.post('/', crearVenta);
router.get('/', obtenerVentas);
router.get('/calendario', obtenerReservasCalendario);
router.get('/excel', descargarReporteExcel);
router.post('/:id/horas-extra', asignarHorasExtra);
router.post('/:id/liquidar', liquidarSaldo);
router.post('/:id/dano-deposito', registrarDanoDeposito);

export default router;

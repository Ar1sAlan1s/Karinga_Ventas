import { Router } from 'express';
import { obtenerCabanas, obtenerCabanaPorId } from '../controllers/cabanasController.js';

const router = Router();

router.get('/', obtenerCabanas);
router.get('/:id', obtenerCabanaPorId);

export default router;

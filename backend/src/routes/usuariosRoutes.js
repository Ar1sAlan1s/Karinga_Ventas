import express from 'express';
import { crearUsuario, listarUsuarios, cambiarEstadoUsuario } from '../controllers/usuariosController.js';
import { verificarAutenticacion, requerirRol } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas de gestión de usuarios requieren ser ADMIN
router.use(verificarAutenticacion, requerirRol('ADMIN'));

router.post('/', crearUsuario);
router.get('/', listarUsuarios);
router.patch('/:id/estado', cambiarEstadoUsuario);

export default router;

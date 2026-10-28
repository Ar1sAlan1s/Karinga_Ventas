import db from '../config/db.js';
import { verificarAccessToken } from '../utils/jwt.js';

/**
 * Middleware para validar el Access Token JWT en peticiones entrantes
 */
export async function verificarAutenticacion(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        exito: false,
        codigo: 'NO_TOKEN',
        mensaje: 'Acceso no autorizado. Debe proporcionar un token de autenticación válido.'
      });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = verificarAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          exito: false,
          codigo: 'TOKEN_EXPIRADO',
          mensaje: 'La sesión ha expirado. Renueve su token mediante refresh.'
        });
      }
      return res.status(401).json({
        exito: false,
        codigo: 'TOKEN_INVALIDO',
        mensaje: 'Token de autenticación no válido.'
      });
    }

    // Comprobar que el usuario aún existe y está activo
    const usuario = await db('usuarios')
      .where({ id: payload.id })
      .select('id', 'nombre', 'email', 'rol', 'activo')
      .first();

    if (!usuario || !usuario.activo) {
      return res.status(403).json({
        exito: false,
        codigo: 'USUARIO_INACTIVO',
        mensaje: 'Usuario inactivo o dado de baja.'
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    console.error('[AUTH ERROR] Error en verificación de token:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno de autenticación.'
    });
  }
}

/**
 * Middleware de control de acceso por roles (RBAC)
 * @param  {...string} rolesPermitidos 
 */
export function requerirRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'No autenticado.'
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        exito: false,
        codigo: 'ROL_INSUFICIENTE',
        mensaje: 'No tienes los permisos requeridos para ejecutar esta acción.'
      });
    }

    next();
  };
}


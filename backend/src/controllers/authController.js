import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import {
  generarAccessToken,
  generarRefreshToken,
  hashToken,
  REFRESH_TOKEN_DAYS
} from '../utils/jwt.js';

// Hash ficticio para mitigar ataques de temporización (Timing Attacks)
const DUMMY_HASH = '$2a$12$NqLq9tV9eLkW49Q2ZzQJkueePzKmV1uWc9bK9cKb2oY1f8K1yvOqm';

const COOKIE_NAME = 'karinga_refresh_token';

/**
 * Obtiene las opciones de cookie seguras según el entorno
 */
function getCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    path: '/'
  };
}

/**
 * Inicio de sesión con protección contra fuerza bruta y mitigación de timing attacks
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe ingresar correo y contraseña válidos.'
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Parámetros inválidos.'
      });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const usuario = await db('usuarios').where({ email: emailNormalizado }).first();

    const passwordHash = usuario ? usuario.password_hash : DUMMY_HASH;
    const esPasswordValido = await bcrypt.compare(password, passwordHash);

    if (!usuario || !esPasswordValido) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas. Verifique su correo y contraseña.'
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Su cuenta ha sido desactivada por un administrador.'
      });
    }

    // Generar Access Token y Refresh Token criptográfico
    const accessToken = generarAccessToken(usuario);
    const refreshToken = generarRefreshToken();
    const tokenHasheado = hashToken(refreshToken);

    const expiraEn = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent']?.substring(0, 250) || null;

    // Registrar sesión en base de datos
    await db('sesiones_tokens').insert({
      usuario_id: usuario.id,
      token_hash: tokenHasheado,
      ip_address: typeof ipAddress === 'string' ? ipAddress.substring(0, 45) : null,
      user_agent: userAgent,
      expira_en: expiraEn,
      revocado: false,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Actualizar marca de último acceso
    await db('usuarios').where({ id: usuario.id }).update({ ultimo_acceso: new Date() });

    // Configurar cookie httpOnly
    res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());

    return res.json({
      exito: true,
      mensaje: 'Inicio de sesión exitoso.',
      token: accessToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('[AUTH LOGIN ERROR]', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno al procesar el inicio de sesión.'
    });
  }
}

/**
 * Renovación silenciosa y persistente de tokens (Refresh Token Rotation)
 */
export async function refresh(req, res) {
  try {
    const rawRefreshToken = req.cookies?.[COOKIE_NAME];

    if (!rawRefreshToken) {
      return res.status(401).json({
        exito: false,
        codigo: 'NO_REFRESH_TOKEN',
        mensaje: 'No hay sesión activa para renovar.'
      });
    }

    const tokenHasheado = hashToken(rawRefreshToken);
    const ahora = new Date();

    const sesion = await db('sesiones_tokens')
      .where({ token_hash: tokenHasheado, revocado: false })
      .andWhere('expira_en', '>', ahora)
      .first();

    if (!sesion) {
      // Cookie inválida, revocada o expirada
      res.clearCookie(COOKIE_NAME, getCookieOptions());
      return res.status(401).json({
        exito: false,
        codigo: 'SESION_EXPIRADA',
        mensaje: 'Sesión expirada o no válida. Inicie sesión nuevamente.'
      });
    }

    const usuario = await db('usuarios')
      .where({ id: sesion.usuario_id, activo: true })
      .first();

    if (!usuario) {
      await db('sesiones_tokens').where({ id: sesion.id }).update({ revocado: true });
      res.clearCookie(COOKIE_NAME, getCookieOptions());
      return res.status(403).json({
        exito: false,
        mensaje: 'Usuario no disponible.'
      });
    }

    // Rotación de Refresh Token para prevenir reutilización
    await db('sesiones_tokens').where({ id: sesion.id }).update({ revocado: true, updated_at: new Date() });

    const nuevoRefreshToken = generarRefreshToken();
    const nuevoTokenHasheado = hashToken(nuevoRefreshToken);
    const nuevaExpiracion = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    await db('sesiones_tokens').insert({
      usuario_id: usuario.id,
      token_hash: nuevoTokenHasheado,
      ip_address: sesion.ip_address,
      user_agent: sesion.user_agent,
      expira_en: nuevaExpiracion,
      revocado: false,
      created_at: new Date(),
      updated_at: new Date()
    });

    const nuevoAccessToken = generarAccessToken(usuario);

    res.cookie(COOKIE_NAME, nuevoRefreshToken, getCookieOptions());

    return res.json({
      exito: true,
      token: nuevoAccessToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('[AUTH REFRESH ERROR]', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al renovar la sesión.'
    });
  }
}

/**
 * Cierre de sesión seguro y revocación en base de datos
 */
export async function logout(req, res) {
  try {
    const rawRefreshToken = req.cookies?.[COOKIE_NAME];
    if (rawRefreshToken) {
      const tokenHasheado = hashToken(rawRefreshToken);
      await db('sesiones_tokens')
        .where({ token_hash: tokenHasheado })
        .update({ revocado: true, updated_at: new Date() });
    }

    res.clearCookie(COOKIE_NAME, getCookieOptions());
    return res.json({
      exito: true,
      mensaje: 'Sesión finalizada con éxito.'
    });
  } catch (error) {
    console.error('[AUTH LOGOUT ERROR]', error);
    res.clearCookie(COOKIE_NAME, getCookieOptions());
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al cerrar sesión.'
    });
  }
}

/**
 * Obtener perfil del usuario actualmente autenticado
 */
export async function perfil(req, res) {
  return res.json({
    exito: true,
    usuario: req.usuario
  });
}

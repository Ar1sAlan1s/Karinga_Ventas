import jwt from 'jsonwebtoken';
import crypto from 'crypto';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('[SEGURIDAD FATAL] Debe definir la variable JWT_SECRET en el entorno de producción.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_only_for_local_development_must_set_in_env_file';
const ACCESS_TOKEN_EXPIRATION = '15m'; // Token de corta duración
export const REFRESH_TOKEN_DAYS = 30; // 30 días de persistencia

/**
 * Genera un Access Token JWT de corta vida
 * @param {object} payload
 * @returns {string}
 */
export function generarAccessToken(payload) {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      rol: payload.rol,
      nombre: payload.nombre
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRATION }
  );
}

/**
 * Genera un Refresh Token criptográficamente seguro
 * @returns {string}
 */
export function generarRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

/**
 * Hashea un Refresh Token para almacenamiento seguro en BD
 * @param {string} token
 * @returns {string}
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verifica y decodifica un Access Token JWT
 * @param {string} token
 * @returns {object}
 */
export function verificarAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

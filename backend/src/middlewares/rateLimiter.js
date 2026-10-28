import rateLimit from 'express-rate-limit';

/**
 * Limitador estricto para intentos de inicio de sesión
 * Evita ataques de fuerza bruta, inundación y credential stuffing
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    exito: false,
    codigo: 'DEMASIADOS_INTENTOS',
    mensaje: 'Demasiados intentos de acceso fallidos desde esta IP. Por seguridad, intente nuevamente en 15 minutos.'
  }
});

/**
 * Limitador para renovación de tokens (refresh)
 */
export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // 60 refrescos por 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    exito: false,
    codigo: 'DEMASIADAS_PETICIONES_REFRESH',
    mensaje: 'Límite de solicitudes de renovación alcanzado. Intente en unos momentos.'
  }
});

/**
 * Limitador general para el resto de la API contra flooding / denegación de servicio
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // 500 peticiones cada 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    exito: false,
    codigo: 'RATE_LIMIT_EXCEEDED',
    mensaje: 'Límite de peticiones excedido. Por favor, disminuya la frecuencia de consultas.'
  }
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import usuariosRoutes from './routes/usuariosRoutes.js';
import cabanasRoutes from './routes/cabanasRoutes.js';
import ventasRoutes from './routes/ventasRoutes.js';
import reservacionesRoutes from './routes/reservacionesRoutes.js';

import { verificarAutenticacion } from './middlewares/authMiddleware.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';

const app = express();

// 1. Cabeceras HTTP de seguridad avanzada con Helmet
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

// 2. Parser de Cookies para lectura segura de Refresh Tokens httpOnly
app.use(cookieParser());

// 3. Configuración de CORS dinámico para desarrollo y producción
const origenesPermitidos = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

if (process.env.FRONTEND_URL) {
  const frontendUrl = process.env.FRONTEND_URL.trim().replace(/\/$/, '');
  if (!origenesPermitidos.includes(frontendUrl)) {
    origenesPermitidos.push(frontendUrl);
  }
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (
      origenesPermitidos.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 4. Límite estricto de tamaño de payload contra ataques de saturación
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 5. Limitador general de peticiones (Protección contra DDoS / Flooding)
app.use(apiRateLimiter);

// 6. Endpoints de Salud (Públicos)
const healthHandler = (req, res) => {
  res.json({
    estado: 'ok',
    servicio: 'Karinga Resort Ecoturístico - API de Ventas y Reservas',
    timestamp: new Date().toISOString()
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// 7. Rutas de Autenticación (Login, Refresh, Logout, Perfil)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// 8. Rutas de Gestión de Usuarios (Exclusivo Administradores)
app.use('/api/usuarios', usuariosRoutes);
app.use('/usuarios', usuariosRoutes);

// 9. Rutas de Negocio Protegidas con JWT (Ventas, Cabañas, Reservaciones)
app.use('/api/cabanas', verificarAutenticacion, cabanasRoutes);
app.use('/cabanas', verificarAutenticacion, cabanasRoutes);

app.use('/api/ventas', verificarAutenticacion, ventasRoutes);
app.use('/ventas', verificarAutenticacion, ventasRoutes);

app.use('/api/reservaciones', verificarAutenticacion, reservacionesRoutes);
app.use('/reservaciones', verificarAutenticacion, reservacionesRoutes);

// Manejador 404
app.use((req, res) => {
  res.status(404).json({
    exito: false,
    mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Manejador Global de Errores
app.use((err, req, res, _next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({
    exito: false,
    mensaje: 'Ocurrió un error inesperado en el servidor',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

export default app;

import express from 'express';
import cors from 'cors';
import cabanasRoutes from './routes/cabanasRoutes.js';
import ventasRoutes from './routes/ventasRoutes.js';
import reservacionesRoutes from './routes/reservacionesRoutes.js';

const app = express();

// Configuración de CORS dinámico para desarrollo local y producción en Vercel
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
    // Permitir peticiones sin origen (como Postman, apps móviles o llamadas internas)
    if (!origin) return callback(null, true);

    // Si coincide con los orígenes permitidos o con dominios de Vercel
    if (
      origenesPermitidos.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }

    // Permisivo por defecto para evitar bloqueos imprevistos en despliegue
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const healthHandler = (req, res) => {
  res.json({
    estado: 'ok',
    servicio: 'Karinga Resort Ecoturístico - API de Ventas y Reservas',
    timestamp: new Date().toISOString()
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Rutas montadas con y sin prefijo /api para garantizar compatibilidad total
app.use('/api/cabanas', cabanasRoutes);
app.use('/cabanas', cabanasRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/ventas', ventasRoutes);
app.use('/api/reservaciones', reservacionesRoutes);
app.use('/reservaciones', reservacionesRoutes);

app.use((req, res) => {
  res.status(404).json({
    exito: false,
    mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, _next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({
    exito: false,
    mensaje: 'Ocurrió un error inesperado en el servidor',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

export default app;

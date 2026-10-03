import express from 'express';
import cors from 'cors';
import cabanasRoutes from './routes/cabanasRoutes.js';
import ventasRoutes from './routes/ventasRoutes.js';
import reservacionesRoutes from './routes/reservacionesRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    estado: 'ok',
    servicio: 'Karinga Resort Ecoturístico - API de Ventas y Reservas',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/cabanas', cabanasRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/reservaciones', reservacionesRoutes);

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

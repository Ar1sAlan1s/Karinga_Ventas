import dotenv from 'dotenv';
import app from './app.js';
import { autoMigrateAndSeed } from './utils/migrateAndSeed.js';

dotenv.config();

const PUERTO = process.env.PORT || 4000;

async function iniciarServidor() {
  try {
    if (process.env.DATABASE_URL) {
      await autoMigrateAndSeed();
    } else {
      console.warn('[AVISO] DATABASE_URL no está definida en las variables de entorno.');
    }

    app.listen(PUERTO, '0.0.0.0', () => {
      console.log(`🌲 Servidor Karinga Backend activo en el puerto ${PUERTO}`);
      console.log(`📍 Endpoint base: http://0.0.0.0:${PUERTO}/api`);
    });
  } catch (error) {
    console.error('Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

iniciarServidor();

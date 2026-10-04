import db from '../config/db.js';
import { seed } from '../seeds/01_cabanas.js';

export async function autoMigrateAndSeed() {
  if (process.env.AUTO_MIGRATE === 'false') {
    return;
  }

  try {
    const [batchNo, log] = await db.migrate.latest();
    if (log && log.length > 0) {
      console.log(`[DB] Migraciones ejecutadas (Lote ${batchNo}):`, log);
    } else {
      console.log('[DB] Base de datos al día con las migraciones.');
    }

    // Verificar si los IDs canónicos están correctamente asignados
    const buenaVista = await db('cabanas').where({ id: 4 }).first();
    const chupicuaro = await db('cabanas').where({ id: 10 }).first();
    const erandini = await db('cabanas').where({ id: 13 }).first();
    const irekaniYrandini = await db('cabanas').where({ nombre: 'Glamping Irekani & Erandini' }).first();

    const conteo = await db('cabanas').count('id as total').first();
    const totalCabanas = parseInt(conteo?.total || 0, 10);

    const necesitaRestaurar =
      totalCabanas === 0 ||
      irekaniYrandini ||
      !buenaVista ||
      buenaVista.nombre !== 'Buena Vista' ||
      !chupicuaro ||
      chupicuaro.nombre !== 'Chupicuaro' ||
      !erandini;

    if (necesitaRestaurar) {
      console.log('[DB] Restaurando IDs canónicos del catálogo de cabañas (Buena Vista=4, Chupicuaro=10, Erandini=13)...');
      await seed(db);
      console.log('[DB] Catálogo de cabañas reestructurado y sincronizado exitosamente.');
    } else {
      console.log(`[DB] Catálogo activo y correcto con ${totalCabanas} cabañas cargadas.`);
    }
  } catch (error) {
    console.error('[DB ERROR] Error al ejecutar migraciones/seed automáticos:', error.message);
  }
}

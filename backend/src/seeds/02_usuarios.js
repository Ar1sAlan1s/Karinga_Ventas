import bcrypt from 'bcryptjs';

/**
 * Semilla para inicializar al usuario Administrador si no existe ningún usuario
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  const tieneUsuarios = await knex.schema.hasTable('usuarios');
  if (!tieneUsuarios) return;

  const conteo = await knex('usuarios').count('id as total').first();
  const total = parseInt(conteo?.total || 0, 10);

  if (total === 0) {
    const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@karinga.com').toLowerCase().trim();
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Karinga2026!';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    await knex('usuarios').insert({
      nombre: 'Administrador Karinga',
      email: adminEmail,
      password_hash: passwordHash,
      rol: 'ADMIN',
      activo: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log(`[SEED] Usuario Administrador inicial creado con éxito: ${adminEmail}`);
  }
}

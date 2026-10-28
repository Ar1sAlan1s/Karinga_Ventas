import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Semilla para inicializar al usuario Administrador inicial.
 * No contiene contraseñas fijas en el código por seguridad.
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  const tieneUsuarios = await knex.schema.hasTable('usuarios');
  if (!tieneUsuarios) return;

  const conteo = await knex('usuarios').count('id as total').first();
  const total = parseInt(conteo?.total || 0, 10);

  if (total === 0) {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    let adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      // Generar contraseña aleatoria criptográfica temporal para no dejar credenciales quemadas en código
      adminPassword = crypto.randomBytes(12).toString('base64url');
      const emailFinal = adminEmail || 'admin@karingaresort.local';
      const passwordHash = await bcrypt.hash(adminPassword, 12);

      await knex('usuarios').insert({
        nombre: 'Administrador Inicial',
        email: emailFinal,
        password_hash: passwordHash,
        rol: 'ADMIN',
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      console.warn('⚠️ [SEGURIDAD] Se creó un Administrador inicial con contraseña temporal aleatoria:');
      console.warn(`   Usuario:    ${emailFinal}`);
      console.warn(`   Contraseña: ${adminPassword}`);
      console.warn('   Se recomienda definir INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD en el archivo .env privado.');
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await knex('usuarios').insert({
      nombre: 'Administrador Karinga',
      email: adminEmail,
      password_hash: passwordHash,
      rol: 'ADMIN',
      activo: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log(`[SEED] Usuario Administrador inicial configurado desde .env: ${adminEmail}`);
  }
}

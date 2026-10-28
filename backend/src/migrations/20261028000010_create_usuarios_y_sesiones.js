/**
 * Migración para crear las tablas de usuarios y sesiones persistentes (refresh tokens)
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasUsuarios = await knex.schema.hasTable('usuarios');
  if (!hasUsuarios) {
    await knex.schema.createTable('usuarios', (table) => {
      table.increments('id').primary();
      table.string('nombre', 100).notNullable();
      table.string('email', 150).notNullable().unique().index();
      table.string('password_hash', 255).notNullable();
      table.string('rol', 30).notNullable().defaultTo('OPERADOR');
      table.boolean('activo').notNullable().defaultTo(true);
      table.timestamp('ultimo_acceso').nullable();
      table.timestamps(true, true);
    });
  }

  const hasSesiones = await knex.schema.hasTable('sesiones_tokens');
  if (!hasSesiones) {
    await knex.schema.createTable('sesiones_tokens', (table) => {
      table.increments('id').primary();
      table.integer('usuario_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('usuarios')
        .onDelete('CASCADE');
      table.string('token_hash', 255).notNullable().index();
      table.string('ip_address', 45).nullable();
      table.string('user_agent', 255).nullable();
      table.timestamp('expira_en').notNullable().index();
      table.boolean('revocado').notNullable().defaultTo(false);
      table.timestamps(true, true);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('sesiones_tokens');
  await knex.schema.dropTableIfExists('usuarios');
}

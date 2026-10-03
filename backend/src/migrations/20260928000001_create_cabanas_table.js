/**
 * Migración: Creación de la tabla de cabañas
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  return knex.schema.createTable('cabanas', (table) => {
    table.increments('id').primary();
    table.string('nombre', 150).notNullable().unique();
    table.integer('capacidad').notNullable();
    table.decimal('precio_entre_semana', 10, 2).notNullable();
    table.decimal('precio_fin_semana', 10, 2).notNullable();
    table.decimal('precio_temporada_alta', 10, 2).notNullable();
    table.decimal('deposito', 10, 2).notNullable();
    table.boolean('activo').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  return knex.schema.dropTableIfExists('cabanas');
}

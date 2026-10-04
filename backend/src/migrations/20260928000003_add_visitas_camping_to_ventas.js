/**
 * Migración: Agregar visitas y camping a la tabla ventas
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  return knex.schema.alterTable('ventas', (table) => {
    table.integer('visitas_personas').notNullable().defaultTo(0);
    table.integer('camping_personas').notNullable().defaultTo(0);
    table.decimal('camping_precio_unitario', 10, 2).notNullable().defaultTo(0.00);
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  return knex.schema.alterTable('ventas', (table) => {
    table.dropColumn('visitas_personas');
    table.dropColumn('camping_personas');
    table.dropColumn('camping_precio_unitario');
  });
}

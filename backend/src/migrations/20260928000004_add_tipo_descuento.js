/**
 * Migración: Agregar tipo y valor de descuento a la tabla ventas
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  return knex.schema.alterTable('ventas', (table) => {
    table.string('tipo_descuento', 20).notNullable().defaultTo('monto'); // 'monto' o 'porcentaje'
    table.decimal('valor_descuento', 10, 2).notNullable().defaultTo(0.00);
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  return knex.schema.alterTable('ventas', (table) => {
    table.dropColumn('tipo_descuento');
    table.dropColumn('valor_descuento');
  });
}

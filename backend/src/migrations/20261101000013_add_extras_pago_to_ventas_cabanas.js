/**
 * Migración: Agregar columnas monto_extras_pagado y metodo_pago_extras a ventas_cabanas
 * para registrar el método y monto cobrado por servicios/horas extra de forma independiente
 * a la liquidación de estancia del check-in.
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  const tieneVentasCabanas = await knex.schema.hasTable('ventas_cabanas');
  if (tieneVentasCabanas) {
    const tieneColMonto = await knex.schema.hasColumn('ventas_cabanas', 'monto_extras_pagado');
    const tieneColMetodo = await knex.schema.hasColumn('ventas_cabanas', 'metodo_pago_extras');

    await knex.schema.alterTable('ventas_cabanas', (table) => {
      if (!tieneColMonto) {
        table.decimal('monto_extras_pagado', 10, 2).notNullable().defaultTo(0.00);
      }
      if (!tieneColMetodo) {
        table.string('metodo_pago_extras', 100).nullable();
      }
    });
  }
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  const tieneVentasCabanas = await knex.schema.hasTable('ventas_cabanas');
  if (tieneVentasCabanas) {
    await knex.schema.alterTable('ventas_cabanas', (table) => {
      table.dropColumn('monto_extras_pagado');
      table.dropColumn('metodo_pago_extras');
    });
  }
}

/**
 * Migración: Agregar columnas otro_extra_monto y otro_extra_concepto a ventas_cabanas
 * para registrar servicios adicionales personalizados (ej. toallas, cobijas, leña, etc.)
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  const tieneVentasCabanas = await knex.schema.hasTable('ventas_cabanas');
  if (tieneVentasCabanas) {
    const tieneColMonto = await knex.schema.hasColumn('ventas_cabanas', 'otro_extra_monto');
    const tieneColConcepto = await knex.schema.hasColumn('ventas_cabanas', 'otro_extra_concepto');

    await knex.schema.alterTable('ventas_cabanas', (table) => {
      if (!tieneColMonto) {
        table.decimal('otro_extra_monto', 10, 2).notNullable().defaultTo(0.00);
      }
      if (!tieneColConcepto) {
        table.string('otro_extra_concepto', 255).nullable();
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
      table.dropColumn('otro_extra_monto');
      table.dropColumn('otro_extra_concepto');
    });
  }
}

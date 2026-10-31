/**
 * Migración para agregar la actividad/producto 'Leña' ($100 MXN) a la tabla 'ventas_actividades'.
 */
export async function up(knex) {
  const tieneTabla = await knex.schema.hasTable('ventas_actividades');
  if (tieneTabla) {
    const hasLena = await knex.schema.hasColumn('ventas_actividades', 'lena_cargas');
    if (!hasLena) {
      await knex.schema.alterTable('ventas_actividades', (table) => {
        table.integer('lena_cargas').defaultTo(0);
        table.decimal('costo_lena', 10, 2).defaultTo(0.00);
      });
    }
  }
}

export async function down(knex) {
  const tieneTabla = await knex.schema.hasTable('ventas_actividades');
  if (tieneTabla) {
    const hasLena = await knex.schema.hasColumn('ventas_actividades', 'lena_cargas');
    if (hasLena) {
      await knex.schema.alterTable('ventas_actividades', (table) => {
        table.dropColumns(['lena_cargas', 'costo_lena']);
      });
    }
  }
}


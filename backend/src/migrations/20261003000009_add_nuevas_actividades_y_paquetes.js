/**
 * Migración para agregar nuevas actividades, productos y paquetes a la tabla 'ventas_actividades':
 * - Gotcha ($2,900)
 * - Interacción con Animales ($200)
 * - Miel Natural ($200)
 * - Huevo de Rancho (Cono $110 / Pieza $4)
 * - Paquetes: Granja Karinga ($220), Vive Karinga ($450), Senderismo Guiado ($70 / $100)
 */
export async function up(knex) {
  const tieneTabla = await knex.schema.hasTable('ventas_actividades');
  if (tieneTabla) {
    const hasGotcha = await knex.schema.hasColumn('ventas_actividades', 'gotcha_paquetes');
    if (!hasGotcha) {
      await knex.schema.alterTable('ventas_actividades', (table) => {
        table.integer('gotcha_paquetes').defaultTo(0);
        table.decimal('costo_gotcha', 10, 2).defaultTo(0.00);
        table.integer('interaccion_animales').defaultTo(0);
        table.decimal('costo_interaccion_animales', 10, 2).defaultTo(0.00);
        table.integer('miel_litros').defaultTo(0);
        table.decimal('costo_miel', 10, 2).defaultTo(0.00);
        table.integer('huevo_conos').defaultTo(0);
        table.integer('huevo_piezas').defaultTo(0);
        table.decimal('costo_huevo', 10, 2).defaultTo(0.00);
        table.integer('paquete_granja').defaultTo(0);
        table.decimal('costo_paquete_granja', 10, 2).defaultTo(0.00);
        table.integer('paquete_vive').defaultTo(0);
        table.decimal('costo_paquete_vive', 10, 2).defaultTo(0.00);
        table.integer('senderismo_personas').defaultTo(0);
        table.decimal('costo_senderismo', 10, 2).defaultTo(0.00);
        table.decimal('senderismo_precio_unitario', 10, 2).defaultTo(0.00);
      });
    }
  }
}

export async function down(knex) {
  const tieneTabla = await knex.schema.hasTable('ventas_actividades');
  if (tieneTabla) {
    await knex.schema.alterTable('ventas_actividades', (table) => {
      table.dropColumns([
        'gotcha_paquetes',
        'costo_gotcha',
        'interaccion_animales',
        'costo_interaccion_animales',
        'miel_litros',
        'costo_miel',
        'huevo_conos',
        'huevo_piezas',
        'costo_huevo',
        'paquete_granja',
        'costo_paquete_granja',
        'paquete_vive',
        'costo_paquete_vive',
        'senderismo_personas',
        'costo_senderismo',
        'senderismo_precio_unitario'
      ]);
    });
  }
}

